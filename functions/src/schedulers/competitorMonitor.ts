import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from '../config';
import { scrapeSahibinden } from '../scrapers/sahibinden';
import { scrapeHepsiemlak } from '../scrapers/hepsiemlak';
import { scrapeEmlakjet } from '../scrapers/emlakjet';
import { detectPortal, extractListingId, createBrowser, scrapeWithRetry, normalizePriceText, randomDelay } from '../scrapers/common';

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
  searchUrl: string,
  maxResults: number = 10
): Promise<ListingPreview[]> {
  return scrapeWithRetry(async () => {
    console.log(`[${portal}] Starting scrape from: ${searchUrl}`);
    console.log(`[${portal}] Max results: ${maxResults}`);

    let browser;
    try {
      // Create browser instance
      const browserInstance = await createBrowser();
      browser = browserInstance.browser;
      const page = browserInstance.page;

      // Navigate to search URL with timeout
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log(`[${portal}] Page loaded successfully`);

      // Add random delay to appear human-like
      await randomDelay(1000, 2000);

      // Check for "no results" message (common Turkish patterns)
      const noResultsText = await page.textContent('body');
      if (noResultsText && (
        noResultsText.includes('sonuç bulunamadı') ||
        noResultsText.includes('ilan bulunamadı') ||
        noResultsText.includes('sonuç yok')
      )) {
        console.log(`[${portal}] No results found on page`);
        return [];
      }

      // Extract listings based on portal
      let listings: ListingPreview[] = [];

      switch (portal) {
        case 'sahibinden':
          listings = await scrapeSahibindenSearchResults(page);
          break;
        case 'hepsiemlak':
          listings = await scrapeHepsiemlakSearchResults(page);
          break;
        case 'emlakjet':
          listings = await scrapeEmlakjetSearchResults(page);
          break;
      }

      console.log(`[${portal}] Found ${listings.length} listing cards on page`);

      // Filter out invalid listings
      const validListings = listings.filter(listing => {
        // Skip if no title or URL
        if (!listing.title || !listing.title.trim()) return false;
        if (!listing.sourceUrl || !listing.sourceUrl.trim()) return false;

        return true;
      });

      const skipped = listings.length - validListings.length;
      if (skipped > 0) {
        console.log(`[${portal}] Skipped ${skipped} listings with missing title/URL`);
      }

      console.log(`[${portal}] Extracted ${validListings.length} valid listings`);

      // Limit to maxResults
      const limitedListings = validListings.slice(0, maxResults);

      if (validListings.length > maxResults) {
        console.log(`[${portal}] Limited from ${validListings.length} to ${maxResults} listings`);
      }

      return limitedListings;
    } catch (error) {
      console.error(`[${portal}] Error scraping search results:`, error);

      // Check if page loaded but selectors didn't match
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn(`[${portal}] Selector timeout - portal HTML structure may have changed`);
        console.warn(`[${portal}] URL: ${searchUrl}`);
      }

      return [];
    } finally {
      // Always close browser
      if (browser) {
        await browser.close();
        console.log(`[${portal}] Browser closed`);
      }
    }
  }, `scrapeSearchResults-${portal}`);
}

/**
 * Scrape Sahibinden search results page
 */
async function scrapeSahibindenSearchResults(page: any): Promise<ListingPreview[]> {
  try {
    // Wait for search results to load
    await page.waitForSelector('.searchResultsItem, [class*="listing-item"], .classified-list tbody tr', {
      timeout: 10000
    });

    // Extract listing cards
    const listings = await page.$$eval(
      '.searchResultsItem, [class*="listing-item"], .classified-list tbody tr',
      (cards: any[]) => {
        return cards.map((card: any) => {
          try {
            // Extract title
            const titleEl = card.querySelector('.classifiedTitle, [class*="title"] a');
            const title = titleEl?.textContent?.trim() || '';

            // Extract URL
            const linkEl = card.querySelector('.classifiedTitle a, [class*="title"] a');
            let sourceUrl = linkEl?.getAttribute('href') || '';
            if (sourceUrl && !sourceUrl.startsWith('http')) {
              sourceUrl = `https://www.sahibinden.com${sourceUrl}`;
            }

            // Extract price
            const priceEl = card.querySelector('.price, [class*="price"]');
            const priceText = priceEl?.textContent?.trim() || '';

            // Extract location
            const locationEl = card.querySelector('.searchResultsLocationValue, [class*="location"]');
            const location = locationEl?.textContent?.trim() || '';

            // Extract photo
            const imgEl = card.querySelector('img');
            let photoUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
            // Filter out data:image URLs
            if (photoUrl.startsWith('data:')) {
              photoUrl = '';
            }

            return {
              title,
              sourceUrl,
              priceText,
              location,
              photoUrl
            };
          } catch (err) {
            return null;
          }
        }).filter((item: any) => item !== null);
      }
    );

    // Process extracted data
    return listings.map((listing: any) => {
      const priceData = normalizePriceText(listing.priceText);
      const sourceId = extractListingId(listing.sourceUrl, 'sahibinden');

      return {
        portal: 'sahibinden' as const,
        title: listing.title,
        sourceUrl: listing.sourceUrl,
        sourceId,
        price: priceData.value,
        location: listing.location,
        photoUrl: listing.photoUrl
      };
    }).filter((listing: ListingPreview) =>
      listing.title && listing.sourceUrl
    );
  } catch (error) {
    console.error('Error scraping Sahibinden search results:', error);
    return [];
  }
}

/**
 * Scrape Hepsiemlak search results page
 */
async function scrapeHepsiemlakSearchResults(page: any): Promise<ListingPreview[]> {
  try {
    // Wait for search results to load
    await page.waitForSelector('.listing-card, [class*="ListingCard"], .list-view-item', {
      timeout: 10000
    });

    // Extract listing cards
    const listings = await page.$$eval(
      '.listing-card, [class*="ListingCard"], .list-view-item',
      (cards: any[]) => {
        return cards.map((card: any) => {
          try {
            // Extract title
            const titleEl = card.querySelector('.listing-title, [class*="Title"]');
            const title = titleEl?.textContent?.trim() || '';

            // Extract URL
            const linkEl = card.querySelector('a[href*="/"]');
            let sourceUrl = linkEl?.getAttribute('href') || '';
            if (sourceUrl && !sourceUrl.startsWith('http')) {
              sourceUrl = `https://www.hepsiemlak.com${sourceUrl}`;
            }

            // Extract price
            const priceEl = card.querySelector('.listing-price, [class*="Price"]');
            const priceText = priceEl?.textContent?.trim() || '';

            // Extract location
            const locationEl = card.querySelector('.listing-location, [class*="Location"]');
            const location = locationEl?.textContent?.trim() || '';

            // Extract photo
            const imgEl = card.querySelector('img');
            let photoUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
            // Filter out data:image URLs
            if (photoUrl.startsWith('data:')) {
              photoUrl = '';
            }

            return {
              title,
              sourceUrl,
              priceText,
              location,
              photoUrl
            };
          } catch (err) {
            return null;
          }
        }).filter((item: any) => item !== null);
      }
    );

    // Process extracted data
    return listings.map((listing: any) => {
      const priceData = normalizePriceText(listing.priceText);
      const sourceId = extractListingId(listing.sourceUrl, 'hepsiemlak');

      return {
        portal: 'hepsiemlak' as const,
        title: listing.title,
        sourceUrl: listing.sourceUrl,
        sourceId,
        price: priceData.value,
        location: listing.location,
        photoUrl: listing.photoUrl
      };
    }).filter((listing: ListingPreview) =>
      listing.title && listing.sourceUrl
    );
  } catch (error) {
    console.error('Error scraping Hepsiemlak search results:', error);
    return [];
  }
}

/**
 * Scrape Emlakjet search results page
 */
async function scrapeEmlakjetSearchResults(page: any): Promise<ListingPreview[]> {
  try {
    // Wait for search results to load
    await page.waitForSelector('.listing-card, [class*="estate-card"], .listing-item', {
      timeout: 10000
    });

    // Extract listing cards
    const listings = await page.$$eval(
      '.listing-card, [class*="estate-card"], .listing-item',
      (cards: any[]) => {
        return cards.map((card: any) => {
          try {
            // Extract title
            const titleEl = card.querySelector('[class*="title"], h3, h4');
            const title = titleEl?.textContent?.trim() || '';

            // Extract URL
            const linkEl = card.querySelector('a');
            let sourceUrl = linkEl?.getAttribute('href') || '';
            if (sourceUrl && !sourceUrl.startsWith('http')) {
              sourceUrl = `https://www.emlakjet.com${sourceUrl}`;
            }

            // Extract price
            const priceEl = card.querySelector('[class*="price"]');
            const priceText = priceEl?.textContent?.trim() || '';

            // Extract location
            const locationEl = card.querySelector('[class*="location"], [class*="address"]');
            const location = locationEl?.textContent?.trim() || '';

            // Extract photo
            const imgEl = card.querySelector('img');
            let photoUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-lazy') || '';
            // Filter out data:image URLs
            if (photoUrl.startsWith('data:')) {
              photoUrl = '';
            }

            return {
              title,
              sourceUrl,
              priceText,
              location,
              photoUrl
            };
          } catch (err) {
            return null;
          }
        }).filter((item: any) => item !== null);
      }
    );

    // Process extracted data
    return listings.map((listing: any) => {
      const priceData = normalizePriceText(listing.priceText);
      const sourceId = extractListingId(listing.sourceUrl, 'emlakjet');

      return {
        portal: 'emlakjet' as const,
        title: listing.title,
        sourceUrl: listing.sourceUrl,
        sourceId,
        price: priceData.value,
        location: listing.location,
        photoUrl: listing.photoUrl
      };
    }).filter((listing: ListingPreview) =>
      listing.title && listing.sourceUrl
    );
  } catch (error) {
    console.error('Error scraping Emlakjet search results:', error);
    return [];
  }
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
