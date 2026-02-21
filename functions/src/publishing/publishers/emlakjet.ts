import { createBrowser, randomDelay } from '../../scrapers/common';
import { resizeForPortal } from '../photoResizer';
import { ListingData, PublishingResult } from '../types';

/**
 * Publish property to emlakjet using Playwright automation
 *
 * This is a skeleton implementation that handles:
 * - Login with credentials
 * - Navigation to listing creation form
 * - Basic form filling
 *
 * TODO: Implement portal-specific details:
 * - Category mapping (propertyType -> emlakjet categories)
 * - Location selection (city/district dropdowns)
 * - Photo upload flow (file input or drag-drop)
 * - API transfer system for partners (emlakjet may have API option)
 * - Form validation error detection
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
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 3. Check login success
    const loginError = await page.locator('.login-error, .error-message').count();
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
    // TODO: Map propertyType to emlakjet category structure
    // Note: emlakjet may have API transfer system for partners

    // 6. Fill form fields
    await page.fill('#title', listing.title);
    await page.fill('#price', String(listing.price));
    await page.fill('#description', listing.description);
    // TODO: Additional fields based on portal form structure:
    // - Location selection (city/district dropdowns)
    // - Property details (rooms, area, etc.)
    // - Features checkboxes

    // 7. Upload photos
    // TODO: Photo upload implementation depends on emlakjet's form structure
    // Photos need to be resized first using resizeForPortal

    // 8. Submit form
    await page.click('button.submit-listing, button[type="submit"]');

    // 9. Wait for confirmation and get listing URL
    await page.waitForURL(/\/ilan\//, { timeout: 30000 });
    const listingUrl = page.url();
    // TODO: Extract listing ID from emlakjet URL pattern
    const listingId = listingUrl.split('/').pop();

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
      error: `Yayinlama hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    };
  } finally {
    await browser.close();
  }
}
