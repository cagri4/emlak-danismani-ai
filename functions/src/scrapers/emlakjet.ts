import { scrapeWithRetry, createBrowser, extractListingId, normalizePriceText, normalizeAreaText, type ScrapedProperty } from './common';

/**
 * Scrape property details from emlakjet.com
 * Turkish real estate portal
 */
export async function scrapeEmlakjet(url: string): Promise<ScrapedProperty> {
  return scrapeWithRetry(async () => {
    let browser;
    try {
      const { browser: br, page } = await createBrowser();
      browser = br;

      // Navigate to the listing page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for main content to load
      await page.waitForSelector('h1, [class*="title"]', { timeout: 10000 });

      // Extract title
      const title = await page.textContent('h1, [class*="DetailTitle"], [class*="listing-title"]')
        .catch(() => 'Başlıksız İlan');

      // Extract price
      const priceText = await page.textContent('[class*="price"], .price, [class*="Price"]')
        .catch(() => '0 TL');
      const { value: price, currency } = normalizePriceText(priceText || '0 TL');

      // Extract location
      let city = '';
      let district = '';
      let neighborhood = '';

      try {
        // Try breadcrumb first
        const breadcrumbs = await page.$$eval('.breadcrumb a, [class*="breadcrumb"] a',
          (elements) => elements.map(el => el.textContent?.trim() || '')
        );
        if (breadcrumbs.length >= 3) {
          city = breadcrumbs[2] || '';
          district = breadcrumbs[3] || '';
          neighborhood = breadcrumbs[4] || '';
        }
      } catch {
        // Try location section
        try {
          const locationText = await page.textContent('[class*="location"], [class*="address"], .location')
            .catch(() => '');
          const parts = locationText?.split(/[,\/]/).map(s => s.trim()) || [];
          city = parts[0] || '';
          district = parts[1] || '';
          neighborhood = parts[2] || '';
        } catch {
          // Location not found
        }
      }

      // Extract area (m²)
      let area = 0;
      try {
        const specs = await page.$$eval('[class*="property-info"] li, [class*="specs"] li, .specs li',
          (elements) => elements.map(el => ({
            label: el.querySelector('.label, strong, [class*="label"]')?.textContent?.trim() || '',
            value: el.querySelector('.value, span:not(.label), [class*="value"]')?.textContent?.trim() || el.textContent?.trim() || ''
          }))
        );
        const areaSpec = specs.find(s =>
          s.label.toLowerCase().includes('m²') ||
          s.label.toLowerCase().includes('metrekare') ||
          s.label.toLowerCase().includes('alan')
        );
        if (areaSpec?.value) {
          area = normalizeAreaText(areaSpec.value);
        }
      } catch {
        // Area not found
      }

      // Extract rooms
      let rooms = '';
      try {
        const specs = await page.$$eval('[class*="property-info"] li, [class*="specs"] li, .specs li',
          (elements) => elements.map(el => ({
            label: el.querySelector('.label, strong, [class*="label"]')?.textContent?.trim() || '',
            value: el.querySelector('.value, span:not(.label), [class*="value"]')?.textContent?.trim() || el.textContent?.trim() || ''
          }))
        );
        const roomsSpec = specs.find(s =>
          s.label.toLowerCase().includes('oda') ||
          s.label.toLowerCase().includes('room')
        );
        rooms = roomsSpec?.value || '';
      } catch {
        // Rooms not found
      }

      // Determine property type
      let propertyType: ScrapedProperty['propertyType'] = 'other';
      const lowerTitle = (title || '').toLowerCase();
      const lowerUrl = url.toLowerCase();

      if (lowerTitle.includes('daire') || lowerUrl.includes('daire')) {
        propertyType = 'daire';
      } else if (lowerTitle.includes('villa') || lowerUrl.includes('villa')) {
        propertyType = 'villa';
      } else if (lowerTitle.includes('arsa') || lowerUrl.includes('arsa')) {
        propertyType = 'arsa';
      } else if (lowerTitle.includes('işyeri') || lowerUrl.includes('isyeri')) {
        propertyType = 'işyeri';
      }

      // Extract features
      const features: string[] = [];
      try {
        const featureElements = await page.$$eval('[class*="features"] li, [class*="amenities"] li, .features li',
          (elements) => elements.map(el => el.textContent?.trim() || '')
        );
        features.push(...featureElements.filter(f => f.length > 0 && f.length < 50));
      } catch {
        // Features not available
      }

      // Extract description
      let description = '';
      try {
        const descText = await page.textContent('[class*="description"], .description, [class*="detail-text"]')
          .catch(() => '');
        description = descText || '';
      } catch {
        // Description not available
      }

      // Extract photo URLs
      const photoUrls: string[] = [];
      try {
        const photos = await page.$$eval('.gallery img, [class*="gallery"] img, [class*="photo"] img',
          (images) => images.map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || '')
            .filter(src => src && !src.includes('data:image'))
        );
        photoUrls.push(...photos);
      } catch {
        // No photos found
      }

      // Extract source ID
      const sourceId = extractListingId(url, 'emlakjet');

      const scrapedData: ScrapedProperty = {
        title: title?.trim() || 'Başlıksız İlan',
        price,
        currency,
        propertyType,
        location: {
          city: city.trim(),
          district: district.trim(),
          neighborhood: neighborhood.trim() || undefined,
          fullAddress: [neighborhood, district, city].filter(Boolean).join(', ')
        },
        area: area > 0 ? area : undefined,
        rooms: rooms || undefined,
        features: features.length > 0 ? features : undefined,
        description: description?.trim() || undefined,
        photoUrls,
        sourceUrl: url,
        sourcePortal: 'emlakjet',
        sourceId
      };

      await browser.close();
      return scrapedData;

    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw new Error(`Failed to scrape emlakjet.com: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, 'scrapeEmlakjet');
}
