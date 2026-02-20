import { scrapeWithRetry, createBrowser, extractListingId, normalizePriceText, normalizeAreaText, type ScrapedProperty } from './common';

/**
 * Scrape property details from hepsiemlak.com
 * Major Turkish real estate portal
 */
export async function scrapeHepsiemlak(url: string): Promise<ScrapedProperty> {
  return scrapeWithRetry(async () => {
    let browser;
    try {
      const { browser: br, page } = await createBrowser();
      browser = br;

      // Navigate to the listing page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for main content to load
      await page.waitForSelector('.detail-title, h1, [class*="title"]', { timeout: 10000 });

      // Extract title
      const title = await page.textContent('.detail-title, h1, [class*="DetailTitle"]')
        .catch(() => page.textContent('h1'))
        .catch(() => 'Başlıksız İlan');

      // Extract price
      const priceText = await page.textContent('.detail-price, [class*="Price"], .price')
        .catch(() => '0 TL');
      const { value: price, currency } = normalizePriceText(priceText || '0 TL');

      // Extract location
      let city = '';
      let district = '';
      let neighborhood = '';

      try {
        // Try breadcrumb first
        const breadcrumbs = await page.$$eval('.breadcrumb a, [class*="breadcrumb"] a, [class*="Breadcrumb"] a',
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
          const locationText = await page.textContent('.location, [class*="Location"], [class*="address"]')
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
        const specs = await page.$$eval('.spec-list li, [class*="spec"] li, [class*="detail-info"] li',
          (elements) => elements.map(el => ({
            label: el.querySelector('.label, strong, [class*="Label"]')?.textContent?.trim() || '',
            value: el.querySelector('.value, span:not(.label), [class*="Value"]')?.textContent?.trim() || el.textContent?.trim() || ''
          }))
        );
        const areaSpec = specs.find(s =>
          s.label.toLowerCase().includes('m²') ||
          s.label.toLowerCase().includes('metrekare') ||
          s.label.toLowerCase().includes('net')
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
        const specs = await page.$$eval('.spec-list li, [class*="spec"] li, [class*="detail-info"] li',
          (elements) => elements.map(el => ({
            label: el.querySelector('.label, strong, [class*="Label"]')?.textContent?.trim() || '',
            value: el.querySelector('.value, span:not(.label), [class*="Value"]')?.textContent?.trim() || el.textContent?.trim() || ''
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
        const featureElements = await page.$$eval('.features li, [class*="features"] li, [class*="amenities"] li',
          (elements) => elements.map(el => el.textContent?.trim() || '')
        );
        features.push(...featureElements.filter(f => f.length > 0 && f.length < 50));
      } catch {
        // Features not available
      }

      // Extract description
      let description = '';
      try {
        const descText = await page.textContent('.description, [class*="Description"], [class*="detail-text"]')
          .catch(() => '');
        description = descText || '';
      } catch {
        // Description not available
      }

      // Extract photo URLs
      const photoUrls: string[] = [];
      try {
        const photos = await page.$$eval('.photo-gallery img, .gallery img, [class*="Gallery"] img, [class*="photo"] img',
          (images) => images.map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '')
            .filter(src => src && !src.includes('data:image'))
        );
        photoUrls.push(...photos);
      } catch {
        // No photos found
      }

      // Extract source ID
      const sourceId = extractListingId(url, 'hepsiemlak');

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
        sourcePortal: 'hepsiemlak',
        sourceId
      };

      await browser.close();
      return scrapedData;

    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw new Error(`Failed to scrape hepsiemlak.com: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, 'scrapeHepsiemlak');
}
