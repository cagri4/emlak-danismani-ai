import { createBrowser, randomDelay } from '../../scrapers/common';
import { generatePortalPhotos } from '../photoResizer';
import { ListingData, PublishingResult } from '../types';

/**
 * Category mapping for sahibinden.com
 * Maps internal property types to sahibinden category paths
 */
const categoryMapping: Record<string, { main: string; sub: string }> = {
  'daire-satilik': { main: 'emlak', sub: 'konut-satilik-daire' },
  'daire-kiralik': { main: 'emlak', sub: 'konut-kiralik-daire' },
  'villa-satilik': { main: 'emlak', sub: 'konut-satilik-villa' },
  'villa-kiralik': { main: 'emlak', sub: 'konut-kiralik-villa' },
  'mustakil-satilik': { main: 'emlak', sub: 'konut-satilik-mustakil-ev' },
  'mustakil-kiralik': { main: 'emlak', sub: 'konut-kiralik-mustakil-ev' },
  'arsa-satilik': { main: 'emlak', sub: 'arsa-satilik' },
  'arsa-kiralik': { main: 'emlak', sub: 'arsa-kiralik' },
  'isyeri-satilik': { main: 'emlak', sub: 'isyeri-satilik' },
  'isyeri-kiralik': { main: 'emlak', sub: 'isyeri-kiralik' },
  'ofis-satilik': { main: 'emlak', sub: 'isyeri-satilik-ofis' },
  'ofis-kiralik': { main: 'emlak', sub: 'isyeri-kiralik-ofis' },
  'dukkan-satilik': { main: 'emlak', sub: 'isyeri-satilik-dukkan' },
  'dukkan-kiralik': { main: 'emlak', sub: 'isyeri-kiralik-dukkan' }
};

/**
 * Publish property to sahibinden.com using Playwright automation
 *
 * Handles:
 * - Login with credentials
 * - Category mapping (propertyType -> sahibinden categories)
 * - Location selection (city/district dropdowns)
 * - Photo upload with automatic resizing
 * - CAPTCHA detection and graceful failure
 * - Form field completion (rooms, area, floor, features)
 */
export async function publishToSahibinden(
  listing: ListingData,
  credentials: { email: string; password: string }
): Promise<PublishingResult> {
  const { browser, page } = await createBrowser();

  try {
    // 1. Navigate to login page
    await page.goto('https://www.sahibinden.com/giris');
    await randomDelay(2000, 3000);

    // 2. Login
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 3. Check login success
    const loginError = await page.locator('.login-error').count();
    if (loginError > 0) {
      return {
        success: false,
        error: 'Giris basarisiz. Lutfen bilgilerinizi kontrol edin.'
      };
    }

    // 4. Navigate to listing creation
    await page.goto('https://www.sahibinden.com/ilan-ver');
    await randomDelay(1000, 2000);

    // 5. Select category using mapping
    const categoryKey = `${listing.propertyType}-${listing.listingType || 'satilik'}`.toLowerCase();
    const category = categoryMapping[categoryKey] || categoryMapping['daire-satilik'];

    await page.click(`[data-category="${category.main}"]`);
    await randomDelay(500, 1000);
    await page.click(`[data-category="${category.sub}"]`);
    await randomDelay(500, 1000);

    // 6. Check for CAPTCHA
    const hasCaptcha = await page.locator('.captcha, .g-recaptcha, #captcha').count() > 0;
    if (hasCaptcha) {
      await page.screenshot({ path: '/tmp/sahibinden-captcha.png' });
      return {
        success: false,
        error: 'CAPTCHA algılandi. Lutfen portal uzerinden manuel olarak tamamlayin. Hata ekran goruntusu: /tmp/sahibinden-captcha.png'
      };
    }

    // 7. Location selection (city/district dropdowns)
    try {
      // Select city
      await page.waitForSelector('#city, select[name="city"], [name="sehir"]', { timeout: 5000 });
      await page.selectOption('#city, select[name="city"], [name="sehir"]', { label: listing.location.city });
      await randomDelay(500, 1000);

      // Wait for district dropdown to populate
      await page.waitForSelector('#district, select[name="district"], [name="ilce"]', { timeout: 5000 });

      // Select district if provided
      if (listing.location.district) {
        try {
          await page.selectOption('#district, select[name="district"], [name="ilce"]', { label: listing.location.district });
          await randomDelay(500, 1000);
        } catch (districtError) {
          console.warn(`District ${listing.location.district} not found, continuing without district selection`);
        }
      }
    } catch (locationError) {
      console.error('Location selection error:', locationError);
      // Continue - location may be optional or have different selectors
    }

    // 8. Fill form fields
    await page.fill('#title, input[name="title"], input[name="baslik"]', listing.title);
    await page.fill('#price, input[name="price"], input[name="fiyat"]', String(listing.price));
    await page.fill('#description, textarea[name="description"], textarea[name="aciklama"]', listing.description);
    await randomDelay(500, 1000);

    // 9. Property details
    if (listing.rooms) {
      try {
        await page.selectOption('#rooms, select[name="rooms"], select[name="oda_sayisi"]', { label: listing.rooms });
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Rooms field not found or invalid value');
      }
    }

    if (listing.area) {
      try {
        await page.fill('#area, input[name="area"], input[name="m2"]', String(listing.area));
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Area field not found');
      }
    }

    // 10. Features (checkboxes)
    for (const feature of listing.features) {
      try {
        // Try to find checkbox by label text or value
        const checkbox = page.locator(`input[type="checkbox"][value*="${feature}"], label:has-text("${feature}") input[type="checkbox"]`).first();
        if (await checkbox.count() > 0) {
          await checkbox.check();
          await randomDelay(200, 400);
        }
      } catch (e) {
        // Feature checkbox not found, skip
      }
    }

    // 11. Upload photos
    if (listing.photoUrls && listing.photoUrls.length > 0) {
      try {
        // Resize photos for sahibinden
        const resizedPhotos = await generatePortalPhotos(listing.photoUrls, 'sahibinden');

        if (resizedPhotos.length > 0) {
          // Find file input
          const fileInput = page.locator('input[type="file"][accept*="image"]').first();

          // Upload photos (Playwright accepts Buffer array directly)
          await fileInput.setInputFiles(
            resizedPhotos.map((photo, index) => ({
              name: `photo-${index + 1}.jpg`,
              mimeType: 'image/jpeg',
              buffer: photo.buffer
            }))
          );

          // Wait for upload confirmation
          await randomDelay(2000, 3000);

          // Check for upload success indicators
          const uploadProgress = page.locator('.upload-progress, .uploading');
          if (await uploadProgress.count() > 0) {
            // Wait for upload to complete
            await page.waitForSelector('.upload-progress, .uploading', { state: 'hidden', timeout: 30000 });
          }
        }
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError);
        // Continue - photos may be optional
      }
    }

    // 12. Check for CAPTCHA again before submit
    const hasCaptchaBeforeSubmit = await page.locator('.captcha, .g-recaptcha, #captcha').count() > 0;
    if (hasCaptchaBeforeSubmit) {
      await page.screenshot({ path: '/tmp/sahibinden-captcha-submit.png' });
      return {
        success: false,
        error: 'CAPTCHA algılandi (gonderim oncesi). Lutfen portal uzerinden manuel olarak tamamlayin. Hata ekran goruntusu: /tmp/sahibinden-captcha-submit.png'
      };
    }

    // 13. Submit form
    await page.click('button.submit-listing, button[type="submit"], .submit-btn, input[type="submit"]');

    // 14. Wait for confirmation and get listing URL
    await page.waitForURL(/\/ilan\/\d+/, { timeout: 30000 });
    const listingUrl = page.url();
    const listingId = listingUrl.match(/\/ilan\/(\d+)/)?.[1];

    return {
      success: true,
      portalListingId: listingId,
      portalListingUrl: listingUrl
    };
  } catch (error) {
    // Screenshot for debugging
    await page.screenshot({ path: '/tmp/sahibinden-error.png' });
    console.error('Sahibinden publishing error:', error);
    return {
      success: false,
      error: `Yayinlama hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Hata ekran goruntusu: /tmp/sahibinden-error.png`
    };
  } finally {
    await browser.close();
  }
}
