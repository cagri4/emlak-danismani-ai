import { scrapeWithRetry, createBrowser, extractListingId, normalizePriceText, normalizeAreaText, type ScrapedProperty } from './common';

/**
 * Scrape property details from sahibinden.com
 * One of Turkey's largest classifieds sites
 */
export async function scrapeSahibinden(url: string): Promise<ScrapedProperty> {
  return scrapeWithRetry(async () => {
    let browser;
    try {
      const { browser: br, page } = await createBrowser();
      browser = br;

      // Navigate to the listing page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for main content to load
      await page.waitForSelector('.classifiedDetailTitle, h1', { timeout: 10000 });

      // Extract title
      const title = await page.textContent('.classifiedDetailTitle, h1')
        .catch(() => page.textContent('h1'))
        .catch(() => 'Başlıksız İlan');

      // Extract price
      const priceText = await page.textContent('.classifiedPrice, .price-text, [class*="price"]')
        .catch(() => '0 TL');
      const { value: price, currency } = normalizePriceText(priceText || '0 TL');

      // Extract location from breadcrumb or location section
      let city = '';
      let district = '';
      let neighborhood = '';

      try {
        const breadcrumbs = await page.$$eval('.breadcrumb a, [class*="breadcrumb"] a', 
          (elements) => elements.map(el => el.textContent?.trim() || '')
        );
        // Usually: Home > Category > City > District > Neighborhood
        if (breadcrumbs.length >= 3) {
          city = breadcrumbs[2] || '';
          district = breadcrumbs[3] || '';
          neighborhood = breadcrumbs[4] || '';
        }
      } catch {
        // Fallback: try to extract from listing details
        const locationText = await page.textContent('[class*="location"], .classified-location')
          .catch(() => '');
        const parts = locationText?.split(/[,\/]/).map(s => s.trim()) || [];
        city = parts[0] || '';
        district = parts[1] || '';
      }

      // Extract area (m²)
      let area = 0;
      try {
        const areaText = await page.textContent('[class*="m2"], .area-text, :text("m²")')
          .catch(() => '');
        area = normalizeAreaText(areaText || '');
      } catch {
        // Try from listing attributes table
        const attributes = await page.$$eval('.classifiedInfoList li, [class*="attributes"] li', 
          (elements) => elements.map(el => ({
            label: el.querySelector('strong, .label')?.textContent?.trim() || '',
            value: el.querySelector('span:not(.label)')?.textContent?.trim() || el.textContent?.trim() || ''
          }))
        );
        const areaAttr = attributes.find(a => 
          a.label.toLowerCase().includes('m²') || 
          a.label.toLowerCase().includes('metrekare') ||
          a.label.toLowerCase().includes('brüt')
        );
        if (areaAttr?.value) {
          area = normalizeAreaText(areaAttr.value);
        }
      }

      // Extract rooms
      let rooms = '';
      try {
        const attributes = await page.$$eval('.classifiedInfoList li, [class*="attributes"] li', 
          (elements) => elements.map(el => ({
            label: el.querySelector('strong, .label')?.textContent?.trim() || '',
            value: el.querySelector('span:not(.label)')?.textContent?.trim() || el.textContent?.trim() || ''
          }))
        );
        const roomsAttr = attributes.find(a => 
          a.label.toLowerCase().includes('oda') || 
          a.label.toLowerCase().includes('room')
        );
        rooms = roomsAttr?.value || '';
      } catch {
        // Rooms not found
      }

      // Determine property type from category or attributes
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
        const featureElements = await page.$$eval('.classifiedInfoList li, [class*="features"] li', 
          (elements) => elements.map(el => el.textContent?.trim() || '')
        );
        features.push(...featureElements.filter(f => f.length > 0 && f.length < 50));
      } catch {
        // Features not available
      }

      // Extract description
      let description = '';
      try {
        const descText = await page.textContent('.classifiedDescription, [class*="description"], [id*="description"]')
          .catch(() => '');
        description = descText || '';
      } catch {
        // Description not available
      }

      // Extract photo URLs
      const photoUrls: string[] = [];
      try {
        const photos = await page.$$eval('.classifiedDetailMainPhoto img, .gallery img, [class*="photo"] img', 
          (images) => images.map(img => img.src || img.getAttribute('data-src') || '')
            .filter(src => src && !src.includes('data:image'))
        );
        photoUrls.push(...photos);
      } catch {
        // No photos found
      }

      // Extract source ID
      const sourceId = extractListingId(url, 'sahibinden');

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
        sourcePortal: 'sahibinden',
        sourceId
      };

      await browser.close();
      return scrapedData;

    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw new Error(`Failed to scrape sahibinden.com: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, 'scrapeSahibinden');
}
