import { chromium, Browser, Page } from 'playwright';
import { backOff } from 'exponential-backoff';
import * as fuzzball from 'fuzzball';
import { db } from '../config';

// Property type definition (duplicated from main app for functions isolation)
interface Property {
  id: string;
  title: string;
  location: {
    city: string;
    district: string;
    neighborhood?: string;
  };
}

/**
 * Scraped property data structure
 * Standardized format across all portal scrapers
 */
export interface ScrapedProperty {
  title: string;
  price: number;
  currency: 'TRY' | 'USD' | 'EUR';
  propertyType: 'daire' | 'villa' | 'arsa' | 'işyeri' | 'other';
  location: {
    city: string;
    district?: string;
    neighborhood?: string;
    fullAddress?: string;
  };
  area?: number;           // m2
  rooms?: string;          // "3+1", "stüdyo", etc.
  features?: string[];     // ["balkon", "otopark", etc.]
  description?: string;
  photoUrls: string[];     // Original URLs (not downloaded yet)
  sourceUrl: string;
  sourcePortal: 'sahibinden' | 'hepsiemlak' | 'emlakjet';
  sourceId?: string;       // Portal's listing ID
}

/**
 * Portal type detection from URL
 */
export type PortalType = 'sahibinden' | 'hepsiemlak' | 'emlakjet' | 'unknown';

/**
 * Detect which portal a URL belongs to
 */
export function detectPortal(url: string): PortalType {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('sahibinden.com')) {
    return 'sahibinden';
  } else if (lowerUrl.includes('hepsiemlak.com')) {
    return 'hepsiemlak';
  } else if (lowerUrl.includes('emlakjet.com')) {
    return 'emlakjet';
  }

  return 'unknown';
}

/**
 * Generic retry wrapper using exponential backoff
 * Handles transient failures when scraping portals
 */
export async function scrapeWithRetry<T>(
  fn: () => Promise<T>,
  operationName = 'scrape'
): Promise<T> {
  return backOff(fn, {
    numOfAttempts: 3,
    startingDelay: 1000,
    maxDelay: 10000,
    timeMultiple: 2,
    retry: (error: any) => {
      // Retry on network errors or timeouts
      const shouldRetry =
        error?.message?.includes('timeout') ||
        error?.message?.includes('network') ||
        error?.message?.includes('ERR_CONNECTION') ||
        error?.code === 'ECONNREFUSED';

      if (shouldRetry) {
        console.log(`Retrying ${operationName} after error:`, error.message);
      }

      return shouldRetry;
    }
  });
}

/**
 * Create browser instance with anti-bot measures
 */
export async function createBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'tr-TR'
  });

  const page = await context.newPage();

  // Add random delay to appear more human-like
  await randomDelay(2000, 4000);

  return { browser, page };
}

/**
 * Random delay helper for anti-bot measures
 */
export async function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Find similar properties using fuzzy string matching
 * Used to detect duplicates before importing
 */
export async function findSimilarProperties(
  scraped: ScrapedProperty,
  userId: string
): Promise<Property[]> {
  try {
    // Get user's properties from Firestore
    const propertiesRef = db.collection('users').doc(userId).collection('properties');
    const snapshot = await propertiesRef.get();

    if (snapshot.empty) {
      return [];
    }

    const properties: Property[] = [];
    snapshot.forEach((doc: any) => {
      properties.push({ id: doc.id, ...doc.data() } as Property);
    });

    // Build search string from scraped property
    const scrapedSearchStr = [
      scraped.title,
      scraped.location.fullAddress || '',
      scraped.location.city,
      scraped.location.district || '',
      scraped.location.neighborhood || ''
    ].join(' ').toLowerCase();

    // Find similar properties using fuzzball
    const similarProperties: Array<{ property: Property; score: number }> = [];

    for (const property of properties) {
      const propertySearchStr = [
        property.title,
        property.location.city,
        property.location.district,
        property.location.neighborhood || ''
      ].join(' ').toLowerCase();

      // Calculate similarity score
      const score = fuzzball.ratio(scrapedSearchStr, propertySearchStr);

      // 75% similarity threshold
      if (score >= 75) {
        similarProperties.push({ property, score });
      }
    }

    // Sort by similarity score (highest first)
    similarProperties.sort((a, b) => b.score - a.score);

    // Return the similar properties (just the property objects)
    return similarProperties.map(item => item.property);
  } catch (error) {
    console.error('Error finding similar properties:', error);
    return [];
  }
}

/**
 * Extract listing ID from portal URL
 */
export function extractListingId(url: string, portal: PortalType): string | undefined {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    switch (portal) {
      case 'sahibinden':
        // Example: /ilan/emlak-konut-satilik-123456789
        const sahibindenMatch = pathname.match(/\/ilan\/[^\/]+-(\d+)/);
        return sahibindenMatch?.[1];

      case 'hepsiemlak':
        // Example: /istanbul-kadikoy-satilik/daire/abc-123456
        const hepsiemlakMatch = pathname.match(/\/([a-z0-9-]+)$/);
        return hepsiemlakMatch?.[1];

      case 'emlakjet':
        // Example: /ilan/12345678-property-title
        const emlakjetMatch = pathname.match(/\/ilan\/(\d+)/);
        return emlakjetMatch?.[1];

      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/**
 * Normalize Turkish price text to number
 * Examples: "2.500.000 TL" -> 2500000, "1,5M TL" -> 1500000
 */
export function normalizePriceText(priceText: string): { value: number; currency: 'TRY' | 'USD' | 'EUR' } {
  let currency: 'TRY' | 'USD' | 'EUR' = 'TRY';

  // Detect currency
  if (priceText.includes('$') || priceText.toUpperCase().includes('USD')) {
    currency = 'USD';
  } else if (priceText.includes('€') || priceText.toUpperCase().includes('EUR')) {
    currency = 'EUR';
  }

  // Remove currency symbols and text
  let numberText = priceText
    .replace(/TL|₺|\$|€|USD|EUR/gi, '')
    .trim();

  // Handle "M" for millions (e.g., "2,5M" -> 2500000)
  if (numberText.toUpperCase().includes('M')) {
    const millionMatch = numberText.match(/([\d.,]+)\s*M/i);
    if (millionMatch) {
      const millions = parseFloat(millionMatch[1].replace(',', '.'));
      return { value: millions * 1000000, currency };
    }
  }

  // Handle "K" for thousands (e.g., "500K" -> 500000)
  if (numberText.toUpperCase().includes('K')) {
    const thousandMatch = numberText.match(/([\d.,]+)\s*K/i);
    if (thousandMatch) {
      const thousands = parseFloat(thousandMatch[1].replace(',', '.'));
      return { value: thousands * 1000, currency };
    }
  }

  // Remove thousands separators and parse
  // Turkish format: 2.500.000,00 or 2,500,000.00
  numberText = numberText.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(numberText) || 0;

  return { value, currency };
}

/**
 * Normalize area text to number (m²)
 * Examples: "150 m²" -> 150, "1.200m2" -> 1200
 */
export function normalizeAreaText(areaText: string): number {
  const numberText = areaText
    .replace(/m²|m2|metrekare/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();

  return parseFloat(numberText) || 0;
}
