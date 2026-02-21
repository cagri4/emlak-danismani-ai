import { createBrowser, randomDelay } from '../../scrapers/common';
import { generatePortalPhotos } from '../photoResizer';
import { ListingData, PublishingResult } from '../types';

/**
 * Category mapping for hepsiemlak
 * Maps internal property types to hepsiemlak category structure
 */
const categoryMapping: Record<string, { type: string; listingType: string }> = {
  'daire-satilik': { type: 'konut', listingType: 'satilik' },
  'daire-kiralik': { type: 'konut', listingType: 'kiralik' },
  'villa-satilik': { type: 'villa', listingType: 'satilik' },
  'villa-kiralik': { type: 'villa', listingType: 'kiralik' },
  'mustakil-satilik': { type: 'mustakil-ev', listingType: 'satilik' },
  'mustakil-kiralik': { type: 'mustakil-ev', listingType: 'kiralik' },
  'arsa-satilik': { type: 'arsa', listingType: 'satilik' },
  'arsa-kiralik': { type: 'arsa', listingType: 'kiralik' },
  'isyeri-satilik': { type: 'isyeri', listingType: 'satilik' },
  'isyeri-kiralik': { type: 'isyeri', listingType: 'kiralik' },
  'ofis-satilik': { type: 'ofis', listingType: 'satilik' },
  'ofis-kiralik': { type: 'ofis', listingType: 'kiralik' },
  'dukkan-satilik': { type: 'dukkan', listingType: 'satilik' },
  'dukkan-kiralik': { type: 'dukkan', listingType: 'kiralik' }
};

/**
 * Publish property to hepsiemlak using Playwright automation
 *
 * Handles:
 * - Login with credentials
 * - Category mapping (propertyType -> hepsiemlak categories)
 * - Location selection (city/district dropdowns or URL-based)
 * - Photo upload with automatic resizing
 * - CAPTCHA detection and graceful failure
 * - Form field completion (rooms, area, floor, features)
 */
export async function publishToHepsiemlak(
  listing: ListingData,
  credentials: { email: string; password: string }
): Promise<PublishingResult> {
  const { browser, page } = await createBrowser();

  try {
    // 1. Navigate to login page
    await page.goto('https://www.hepsiemlak.com/giris');
    await randomDelay(2000, 3000);

    // 2. Login
    await page.fill('input[name="email"], input[type="email"], #email', credentials.email);
    await page.fill('input[name="password"], input[type="password"], #password', credentials.password);
    await page.click('button[type="submit"], .login-button, .submit-button');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 3. Check login success
    const loginError = await page.locator('.login-error, .error-message, .alert-danger').count();
    if (loginError > 0) {
      return {
        success: false,
        error: 'Giris basarisiz. Lutfen bilgilerinizi kontrol edin.'
      };
    }

    // 4. Navigate to listing creation with category
    const categoryKey = `${listing.propertyType}-${listing.listingType || 'satilik'}`.toLowerCase();
    const category = categoryMapping[categoryKey] || categoryMapping['daire-satilik'];

    // Try URL-based navigation first (common pattern: /ilan-ver/emlak/konut/satilik/[city]/[district])
    const baseUrl = `https://www.hepsiemlak.com/ilan-ver/${category.type}/${category.listingType}`;
    await page.goto(baseUrl);
    await randomDelay(1000, 2000);

    // 5. Check for CAPTCHA
    const hasCaptcha = await page.locator('.captcha, .g-recaptcha, #captcha, [class*="captcha"]').count() > 0;
    if (hasCaptcha) {
      await page.screenshot({ path: '/tmp/hepsiemlak-captcha.png' });
      return {
        success: false,
        error: 'CAPTCHA algılandi. Lutfen portal uzerinden manuel olarak tamamlayin. Hata ekran goruntusu: /tmp/hepsiemlak-captcha.png'
      };
    }

    // 6. Location selection (city/district)
    try {
      // Wait for city selector
      await page.waitForSelector('select[name*="city"], select[name*="sehir"], #city, #sehir', { timeout: 5000 });
      await page.selectOption('select[name*="city"], select[name*="sehir"], #city, #sehir', { label: listing.location.city });
      await randomDelay(500, 1000);

      // Wait for district dropdown to populate
      if (listing.location.district) {
        try {
          await page.waitForSelector('select[name*="district"], select[name*="ilce"], #district, #ilce', { timeout: 5000 });
          await page.selectOption('select[name*="district"], select[name*="ilce"], #district, #ilce', { label: listing.location.district });
          await randomDelay(500, 1000);
        } catch (districtError) {
          console.warn(`District ${listing.location.district} not found, continuing without district selection`);
        }
      }
    } catch (locationError) {
      console.error('Location selection error:', locationError);
      // Continue - location may be pre-selected via URL
    }

    // 7. Fill form fields
    await page.fill('input[name*="title"], input[name*="baslik"], #title, #baslik', listing.title);
    await page.fill('input[name*="price"], input[name*="fiyat"], #price, #fiyat', String(listing.price));
    await page.fill('textarea[name*="description"], textarea[name*="aciklama"], #description, #aciklama', listing.description);
    await randomDelay(500, 1000);

    // 8. Property details
    if (listing.rooms) {
      try {
        await page.selectOption('select[name*="rooms"], select[name*="oda"], #rooms, #oda_sayisi', { label: listing.rooms });
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Rooms field not found or invalid value');
      }
    }

    if (listing.area) {
      try {
        await page.fill('input[name*="area"], input[name*="m2"], #area, #metrekare', String(listing.area));
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Area field not found');
      }
    }

    if (listing.floor !== undefined) {
      try {
        await page.fill('input[name*="floor"], input[name*="kat"], #floor, #kat', String(listing.floor));
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Floor field not found');
      }
    }

    if (listing.buildingAge !== undefined) {
      try {
        await page.fill('input[name*="age"], input[name*="yasi"], select[name*="age"], #buildingAge', String(listing.buildingAge));
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Building age field not found');
      }
    }

    // 9. Features (checkboxes)
    for (const feature of listing.features) {
      try {
        const checkbox = page.locator(`input[type="checkbox"][value*="${feature}"], label:has-text("${feature}") input[type="checkbox"]`).first();
        if (await checkbox.count() > 0) {
          await checkbox.check();
          await randomDelay(200, 400);
        }
      } catch (e) {
        // Feature checkbox not found, skip
      }
    }

    // 10. Upload photos
    if (listing.photoUrls && listing.photoUrls.length > 0) {
      try {
        // Resize photos for hepsiemlak
        const resizedPhotos = await generatePortalPhotos(listing.photoUrls, 'hepsiemlak');

        if (resizedPhotos.length > 0) {
          // Find file input - try multiple selectors
          const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][name*="photo"], input[type="file"][name*="foto"], .photo-upload input[type="file"]').first();

          // Upload photos
          await fileInput.setInputFiles(
            resizedPhotos.map((photo, index) => ({
              name: `photo-${index + 1}.jpg`,
              mimeType: 'image/jpeg',
              buffer: photo.buffer
            }))
          );

          // Wait for upload confirmation
          await randomDelay(2000, 3000);

          // Check for upload progress and wait for completion
          const uploadProgress = page.locator('.upload-progress, .uploading, [class*="upload"]');
          if (await uploadProgress.count() > 0) {
            await page.waitForSelector('.upload-progress, .uploading, [class*="upload"]', { state: 'hidden', timeout: 30000 });
          }
        }
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError);
        // Continue - photos may be optional
      }
    }

    // 11. Check for CAPTCHA again before submit
    const hasCaptchaBeforeSubmit = await page.locator('.captcha, .g-recaptcha, #captcha, [class*="captcha"]').count() > 0;
    if (hasCaptchaBeforeSubmit) {
      await page.screenshot({ path: '/tmp/hepsiemlak-captcha-submit.png' });
      return {
        success: false,
        error: 'CAPTCHA algılandi (gonderim oncesi). Lutfen portal uzerinden manuel olarak tamamlayin. Hata ekran goruntusu: /tmp/hepsiemlak-captcha-submit.png'
      };
    }

    // 12. Submit form
    await page.click('button.submit-listing, button[type="submit"], .submit-button, .kaydet, button:has-text("Yayınla")');

    // 13. Wait for confirmation and get listing URL
    await page.waitForURL(/\/ilan\//, { timeout: 30000 });
    const listingUrl = page.url();
    // Extract listing ID from URL (pattern may vary)
    const listingId = listingUrl.match(/\/ilan\/([^\/\?]+)/)?.[1];

    return {
      success: true,
      portalListingId: listingId,
      portalListingUrl: listingUrl
    };
  } catch (error) {
    // Screenshot for debugging
    await page.screenshot({ path: '/tmp/hepsiemlak-error.png' });
    console.error('Hepsiemlak publishing error:', error);
    return {
      success: false,
      error: `Yayinlama hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Hata ekran goruntusu: /tmp/hepsiemlak-error.png`
    };
  } finally {
    await browser.close();
  }
}
