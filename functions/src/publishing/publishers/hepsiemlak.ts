import { createBrowser, randomDelay } from '../../scrapers/common';
import { resizeForPortal } from '../photoResizer';
import { ListingData, PublishingResult } from '../types';

/**
 * Publish property to hepsiemlak using Playwright automation
 *
 * This is a skeleton implementation that handles:
 * - Login with credentials
 * - Navigation to listing creation form
 * - Basic form filling
 *
 * TODO: Implement portal-specific details:
 * - Category mapping (propertyType -> hepsiemlak categories)
 * - Location selection (city/district dropdowns)
 * - Photo upload flow (file input or drag-drop)
 * - Form validation error detection
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
    await page.goto('https://www.hepsiemlak.com/ilan-ver');
    await randomDelay(1000, 2000);

    // 5. Select category
    // TODO: Map propertyType to hepsiemlak category structure
    // Hepsiemlak may have different category selection UX

    // 6. Fill form fields
    await page.fill('#title', listing.title);
    await page.fill('#price', String(listing.price));
    await page.fill('#description', listing.description);
    // TODO: Additional fields based on portal form structure:
    // - Location selection (city/district dropdowns)
    // - Property details (rooms, area, etc.)
    // - Features checkboxes

    // 7. Upload photos
    // TODO: Photo upload implementation depends on hepsiemlak's form structure
    // Photos need to be resized first using resizeForPortal

    // 8. Submit form
    await page.click('button.submit-listing, button[type="submit"]');

    // 9. Wait for confirmation and get listing URL
    await page.waitForURL(/\/ilan\//, { timeout: 30000 });
    const listingUrl = page.url();
    // TODO: Extract listing ID from hepsiemlak URL pattern
    const listingId = listingUrl.split('/').pop();

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
      error: `Yayinlama hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    };
  } finally {
    await browser.close();
  }
}
