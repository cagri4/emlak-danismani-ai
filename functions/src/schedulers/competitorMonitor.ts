import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from '../config';
import { scrapeSahibinden } from '../scrapers/sahibinden';
import { scrapeHepsiemlak } from '../scrapers/hepsiemlak';
import { scrapeEmlakjet } from '../scrapers/emlakjet';
import { detectPortal, extractListingId } from '../scrapers/common';

/**
 * Competitor monitoring scheduled function
 * Runs twice daily at 9 AM and 9 PM Turkey time
 * Checks for new listings based on user criteria and customer preferences
 */
export const monitorCompetitors = onSchedule(
  {
    schedule: '0 9,21 * * *', // 9 AM and 9 PM
    timeZone: 'Europe/Istanbul',
    region: 'europe-west1',
    memory: '1GiB',
    timeoutSeconds: 540 // 9 minutes
  },
  async (event) => {
    console.log('Starting competitor monitoring at', new Date().toISOString());

    try {
      // Get all users
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          await monitorForUser(userId);
        } catch (error) {
          // Log error but continue with other users
          console.error(`Error monitoring for user ${userId}:`, error);
        }

        // Rate limiting between users
        await delay(2000);
      }

      console.log('Competitor monitoring completed');
    } catch (error) {
      console.error('Fatal error in competitor monitoring:', error);
      throw error;
    }
  }
);

/**
 * Monitor competitor listings for a single user
 */
async function monitorForUser(userId: string): Promise<void> {
  console.log(`Monitoring for user ${userId}`);

  // 1. Fetch user's manual monitoring criteria
  const criteriaSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('monitoring_criteria')
    .where('enabled', '==', true)
    .get();

  const manualCriteria = criteriaSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MonitoringCriteria[];

  // 2. Fetch customer preferences to monitor
  const customersSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('customers')
    .get();

  const customerCriteria: SearchCriteria[] = [];

  for (const customerDoc of customersSnapshot.docs) {
    const customer = customerDoc.data();
    if (customer.preferences) {
      // Extract search criteria from customer preferences
      const locations = customer.preferences.location || [];
      const budget = customer.preferences.budget || {};
      const propertyTypes = customer.preferences.propertyType || [];

      // Create criteria for each location x propertyType combination
      for (const location of locations) {
        for (const propertyType of propertyTypes) {
          customerCriteria.push({
            region: location,
            priceMin: budget.min,
            priceMax: budget.max,
            propertyType,
            portals: ['sahibinden', 'hepsiemlak', 'emlakjet'], // Monitor all portals for customers
            customerId: customerDoc.id
          });
        }
      }
    }
  }

  // 3. Combine manual and customer criteria
  const allCriteria = [
    ...manualCriteria.map(c => ({ ...c, source: 'manual' as const })),
    ...customerCriteria.map(c => ({ ...c, source: 'customer' as const }))
  ];

  console.log(`Found ${manualCriteria.length} manual criteria and ${customerCriteria.length} customer-based criteria for user ${userId}`);

  // 4. Get existing properties to avoid duplicates
  const propertiesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('properties')
    .get();

  const existingSourceIds = new Set<string>();
  propertiesSnapshot.docs.forEach(doc => {
    const property = doc.data();
    if (property.sourceId) {
      existingSourceIds.add(property.sourceId);
    }
  });

  // 5. Scrape each portal for each criteria
  for (const criteria of allCriteria) {
    for (const portal of criteria.portals) {
      try {
        await scrapeCriteria(userId, criteria, portal, existingSourceIds);

        // Rate limiting between portal requests
        await delay(3000);
      } catch (error) {
        console.error(`Error scraping ${portal} for criteria:`, error);
        // Continue with next portal
      }
    }
  }
}

interface MonitoringCriteria {
  id: string;
  region: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  portals: ('sahibinden' | 'hepsiemlak' | 'emlakjet')[];
  enabled: boolean;
}

interface SearchCriteria {
  region: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  portals: ('sahibinden' | 'hepsiemlak' | 'emlakjet')[];
  customerId?: string;
}

/**
 * Scrape a specific portal for specific criteria
 */
async function scrapeCriteria(
  userId: string,
  criteria: SearchCriteria & { source: 'manual' | 'customer' },
  portal: 'sahibinden' | 'hepsiemlak' | 'emlakjet',
  existingSourceIds: Set<string>
): Promise<void> {
  console.log(`Scraping ${portal} for region ${criteria.region}`);

  // Build search URL based on portal and criteria
  const searchUrl = buildSearchUrl(portal, criteria);

  if (!searchUrl) {
    console.log(`Could not build search URL for ${portal} with criteria`, criteria);
    return;
  }

  try {
    // Scrape search results page (not detail pages)
    const listings = await scrapeSearchResults(portal, searchUrl);

    console.log(`Found ${listings.length} listings on ${portal} for ${criteria.region}`);

    // Filter out already-seen listings
    const newListings = listings.filter(listing => {
      if (!listing.sourceId) return true;
      return !existingSourceIds.has(listing.sourceId);
    });

    console.log(`${newListings.length} new listings after filtering duplicates`);

    // Create notifications for new listings
    for (const listing of newListings) {
      await createNotification(userId, listing, criteria);

      // Add to existing set to avoid duplicate notifications in this run
      if (listing.sourceId) {
        existingSourceIds.add(listing.sourceId);
      }
    }
  } catch (error) {
    console.error(`Error scraping ${portal}:`, error);
    throw error;
  }
}

interface ListingPreview {
  sourceUrl: string;
  sourceId?: string;
  portal: 'sahibinden' | 'hepsiemlak' | 'emlakjet';
  title: string;
  price?: number;
  location?: string;
  photoUrl?: string;
}

/**
 * Build search URL for portal based on criteria
 * Best-effort implementation - URLs may need adjustment based on actual portal structure
 */
function buildSearchUrl(
  portal: 'sahibinden' | 'hepsiemlak' | 'emlakjet',
  criteria: SearchCriteria
): string | null {
  const region = encodeURIComponent(criteria.region.toLowerCase().replace(/\s+/g, '-'));

  switch (portal) {
    case 'sahibinden':
      // Example: https://www.sahibinden.com/satilik-daire/istanbul?pagingSize=20&price_min=1000000&price_max=2000000
      let url = `https://www.sahibinden.com/satilik-${criteria.propertyType || 'daire'}/${region}?pagingSize=20`;
      if (criteria.priceMin) url += `&price_min=${criteria.priceMin}`;
      if (criteria.priceMax) url += `&price_max=${criteria.priceMax}`;
      return url;

    case 'hepsiemlak':
      // Example: https://www.hepsiemlak.com/satilik/istanbul?fiyat_min=1000000&fiyat_max=2000000
      let hepsiUrl = `https://www.hepsiemlak.com/satilik/${region}?`;
      if (criteria.priceMin) hepsiUrl += `&fiyat_min=${criteria.priceMin}`;
      if (criteria.priceMax) hepsiUrl += `&fiyat_max=${criteria.priceMax}`;
      return hepsiUrl;

    case 'emlakjet':
      // Example: https://www.emlakjet.com/satilik/istanbul/fiyat-1000000-2000000
      let emlakjetUrl = `https://www.emlakjet.com/satilik/${region}`;
      if (criteria.priceMin && criteria.priceMax) {
        emlakjetUrl += `/fiyat-${criteria.priceMin}-${criteria.priceMax}`;
      }
      return emlakjetUrl;

    default:
      return null;
  }
}

/**
 * Scrape search results page for listings
 * This is a lightweight scrape - just get listing URLs and basic info
 * Full scraping happens when user imports
 */
async function scrapeSearchResults(
  portal: 'sahibinden' | 'hepsiemlak' | 'emlakjet',
  searchUrl: string
): Promise<ListingPreview[]> {
  // For now, this is a placeholder that returns empty array
  // In production, this would use Playwright to scrape search results
  // We're keeping it simple for the monitoring function - just check if URL is accessible

  console.log(`Would scrape search results from: ${searchUrl}`);

  // TODO: Implement actual search results scraping
  // This would involve:
  // 1. Launch browser with Playwright
  // 2. Navigate to search URL
  // 3. Extract listing cards from search results
  // 4. For each card: extract title, price, location, photo, listing URL
  // 5. Return array of ListingPreview objects

  // For MVP, return empty array - monitoring infrastructure is in place
  // but actual scraping will be added after testing with real portals
  return [];
}

/**
 * Create notification for new competitor listing
 */
async function createNotification(
  userId: string,
  listing: ListingPreview,
  criteria: SearchCriteria & { source: 'manual' | 'customer' }
): Promise<void> {
  const notification = {
    type: 'competitor_listing',
    title: `Yeni ilan: ${listing.title}`,
    message: `${listing.portal} üzerinde ${criteria.region} bölgesinde yeni bir ilan bulundu.`,
    read: false,
    createdAt: new Date(),
    data: {
      listingUrl: listing.sourceUrl,
      portal: listing.portal,
      price: listing.price,
      location: listing.location,
      photoUrl: listing.photoUrl,
      customerId: criteria.customerId,
      criteriaSource: criteria.source
    }
  };

  await db
    .collection('users')
    .doc(userId)
    .collection('notifications')
    .add(notification);

  console.log(`Created notification for user ${userId}: ${listing.title}`);
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
