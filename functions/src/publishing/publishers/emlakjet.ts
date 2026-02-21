import { createBrowser, randomDelay } from '../../scrapers/common';
import { generatePortalPhotos } from '../photoResizer';
import { ListingData, PublishingResult } from '../types';

/**
 * Category mapping for emlakjet
 * Maps internal property types to emlakjet category structure
 */
const categoryMapping: Record<string, { category: string; subCategory: string }> = {
  'daire-satilik': { category: 'konut', subCategory: 'daire' },
  'daire-kiralik': { category: 'konut', subCategory: 'daire' },
  'villa-satilik': { category: 'konut', subCategory: 'villa' },
  'villa-kiralik': { category: 'konut', subCategory: 'villa' },
  'mustakil-satilik': { category: 'konut', subCategory: 'mustakil-ev' },
  'mustakil-kiralik': { category: 'konut', subCategory: 'mustakil-ev' },
  'arsa-satilik': { category: 'arsa', subCategory: 'arsa' },
  'arsa-kiralik': { category: 'arsa', subCategory: 'arsa' },
  'isyeri-satilik': { category: 'isyeri', subCategory: 'isyeri' },
  'isyeri-kiralik': { category: 'isyeri', subCategory: 'isyeri' },
  'ofis-satilik': { category: 'isyeri', subCategory: 'ofis' },
  'ofis-kiralik': { category: 'isyeri', subCategory: 'ofis' },
  'dukkan-satilik': { category: 'isyeri', subCategory: 'dukkan' },
  'dukkan-kiralik': { category: 'isyeri', subCategory: 'dukkan' }
};

/**
 * Publish property to emlakjet using Playwright automation
 *
 * Handles:
 * - Login with credentials
 * - Category mapping (propertyType -> emlakjet categories)
 * - Location selection (city/district dropdowns or form-based)
 * - Photo upload with automatic resizing
 * - CAPTCHA detection and graceful failure
 * - Form field completion (rooms, area, floor, features)
 *
 * Note: emlakjet may have API transfer system for partners, but this
 * implementation uses browser automation as fallback
 */
export async function publishToEmlakjet(
  listing: ListingData,
  credentials: { email: string; password: string }
): Promise<PublishingResult> {
  const { browser, page } = await createBrowser();

  try {
    // 1. Navigate to login page
    await page.goto('https://www.emlakjet.com/uye-girisi');
    await randomDelay(2000, 3000);

    // 2. Login
    await page.fill('input[name="email"], input[type="email"], #email', credentials.email);
    await page.fill('input[name="password"], input[type="password"], #password', credentials.password);
    await page.click('button[type="submit"], .login-btn, .giris-yap');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 3. Check login success
    const loginError = await page.locator('.login-error, .error-message, .alert-error, .hata').count();
    if (loginError > 0) {
      return {
        success: false,
        error: 'Giris basarisiz. Lutfen bilgilerinizi kontrol edin.'
      };
    }

    // 4. Navigate to listing creation
    await page.goto('https://www.emlakjet.com/ilan-ver');
    await randomDelay(1000, 2000);

    // 5. Select category
    const categoryKey = `${listing.propertyType}-${listing.listingType || 'satilik'}`.toLowerCase();
    const category = categoryMapping[categoryKey] || categoryMapping['daire-satilik'];

    try {
      // Select listing type (satilik/kiralik)
      const listingTypeSelector = `select[name*="ilanTipi"], select[name*="listingType"], #ilanTipi`;
      await page.waitForSelector(listingTypeSelector, { timeout: 5000 });
      await page.selectOption(listingTypeSelector, { label: listing.listingType || 'satilik' });
      await randomDelay(500, 1000);

      // Select category
      const categorySelector = `select[name*="category"], select[name*="kategori"], #kategori`;
      await page.waitForSelector(categorySelector, { timeout: 5000 });
      await page.selectOption(categorySelector, { label: category.category });
      await randomDelay(500, 1000);

      // Select sub-category if available
      try {
        const subCategorySelector = `select[name*="subCategory"], select[name*="altKategori"], #altKategori`;
        await page.waitForSelector(subCategorySelector, { timeout: 3000 });
        await page.selectOption(subCategorySelector, { label: category.subCategory });
        await randomDelay(500, 1000);
      } catch (e) {
        console.warn('Sub-category field not found, continuing');
      }
    } catch (categoryError) {
      console.error('Category selection error:', categoryError);
      // Continue - category may be pre-selected or have different structure
    }

    // 6. Check for CAPTCHA
    const hasCaptcha = await page.locator('.captcha, .g-recaptcha, #captcha, [class*="captcha"]').count() > 0;
    if (hasCaptcha) {
      await page.screenshot({ path: '/tmp/emlakjet-captcha.png' });
      return {
        success: false,
        error: 'CAPTCHA algılandi. Lutfen portal uzerinden manuel olarak tamamlayin. Hata ekran goruntusu: /tmp/emlakjet-captcha.png'
      };
    }

    // 7. Location selection (city/district)
    try {
      // Select city
      await page.waitForSelector('select[name*="city"], select[name*="sehir"], select[name*="il"], #city, #sehir', { timeout: 5000 });
      await page.selectOption('select[name*="city"], select[name*="sehir"], select[name*="il"], #city, #sehir', { label: listing.location.city });
      await randomDelay(500, 1000);

      // Wait for and select district
      if (listing.location.district) {
        try {
          await page.waitForSelector('select[name*="district"], select[name*="ilce"], #district, #ilce', { timeout: 5000 });
          await page.selectOption('select[name*="district"], select[name*="ilce"], #district, #ilce', { label: listing.location.district });
          await randomDelay(500, 1000);
        } catch (districtError) {
          console.warn(`District ${listing.location.district} not found, continuing without district selection`);
        }
      }

      // Neighborhood if available
      if (listing.location.neighborhood) {
        try {
          await page.waitForSelector('select[name*="neighborhood"], select[name*="mahalle"], #mahalle', { timeout: 3000 });
          await page.selectOption('select[name*="neighborhood"], select[name*="mahalle"], #mahalle', { label: listing.location.neighborhood });
          await randomDelay(500, 1000);
        } catch (e) {
          console.warn('Neighborhood field not found, continuing');
        }
      }
    } catch (locationError) {
      console.error('Location selection error:', locationError);
      // Continue - location may be optional
    }

    // 8. Fill form fields
    await page.fill('input[name*="title"], input[name*="baslik"], #title, #baslik', listing.title);
    await page.fill('input[name*="price"], input[name*="fiyat"], #price, #fiyat', String(listing.price));
    await page.fill('textarea[name*="description"], textarea[name*="aciklama"], #description, #aciklama', listing.description);
    await randomDelay(500, 1000);

    // 9. Property details
    if (listing.rooms) {
      try {
        await page.selectOption('select[name*="rooms"], select[name*="oda"], #rooms, #odaSayisi', { label: listing.rooms });
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Rooms field not found or invalid value');
      }
    }

    if (listing.area) {
      try {
        await page.fill('input[name*="area"], input[name*="m2"], input[name*="metrekare"], #area, #m2', String(listing.area));
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Area field not found');
      }
    }

    if (listing.floor !== undefined) {
      try {
        await page.fill('input[name*="floor"], input[name*="kat"], select[name*="kat"], #floor, #kat', String(listing.floor));
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Floor field not found');
      }
    }

    if (listing.buildingAge !== undefined) {
      try {
        await page.selectOption('select[name*="age"], select[name*="yasi"], select[name*="binaYasi"], #binaYasi', { label: String(listing.buildingAge) });
        await randomDelay(300, 500);
      } catch (e) {
        console.warn('Building age field not found');
      }
    }

    // 10. Features (checkboxes)
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

    // 11. Upload photos
    if (listing.photoUrls && listing.photoUrls.length > 0) {
      try {
        // Resize photos for emlakjet
        const resizedPhotos = await generatePortalPhotos(listing.photoUrls, 'emlakjet');

        if (resizedPhotos.length > 0) {
          // Find file input - try multiple selectors
          const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][name*="photo"], input[type="file"][name*="foto"], input[type="file"][name*="resim"], .photo-upload input[type="file"]').first();

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
          const uploadProgress = page.locator('.upload-progress, .uploading, .yukleniyor, [class*="upload"]');
          if (await uploadProgress.count() > 0) {
            await page.waitForSelector('.upload-progress, .uploading, .yukleniyor, [class*="upload"]', { state: 'hidden', timeout: 30000 });
          }
        }
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError);
        // Continue - photos may be optional
      }
    }

    // 12. Check for CAPTCHA again before submit
    const hasCaptchaBeforeSubmit = await page.locator('.captcha, .g-recaptcha, #captcha, [class*="captcha"]').count() > 0;
    if (hasCaptchaBeforeSubmit) {
      await page.screenshot({ path: '/tmp/emlakjet-captcha-submit.png' });
      return {
        success: false,
        error: 'CAPTCHA algılandi (gonderim oncesi). Lutfen portal uzerinden manuel olarak tamamlayin. Hata ekran goruntusu: /tmp/emlakjet-captcha-submit.png'
      };
    }

    // 13. Submit form
    await page.click('button.submit-listing, button[type="submit"], .submit-btn, .kaydet-btn, button:has-text("Yayınla"), button:has-text("Kaydet")');

    // 14. Wait for confirmation and get listing URL
    await page.waitForURL(/\/ilan\//, { timeout: 30000 });
    const listingUrl = page.url();
    // Extract listing ID from URL
    const listingId = listingUrl.match(/\/ilan\/([^\/\?]+)/)?.[1];

    return {
      success: true,
      portalListingId: listingId,
      portalListingUrl: listingUrl
    };
  } catch (error) {
    // Screenshot for debugging
    await page.screenshot({ path: '/tmp/emlakjet-error.png' });
    console.error('Emlakjet publishing error:', error);
    return {
      success: false,
      error: `Yayinlama hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Hata ekran goruntusu: /tmp/emlakjet-error.png`
    };
  } finally {
    await browser.close();
  }
}
