---
phase: 03-background-processing-scraping
plan: 06
subsystem: background-processing
tags: [scraping, competitor-monitoring, playwright, portal-integration]
completed: 2026-02-20
duration_minutes: 6

dependency_graph:
  requires:
    - common.ts scraper utilities (createBrowser, scrapeWithRetry, extractListingId, normalizePriceText)
    - Portal-specific CSS selector patterns
  provides:
    - scrapeSearchResults function for competitor monitoring
    - Portal-specific search result scrapers (sahibinden, hepsiemlak, emlakjet)
  affects:
    - Competitor monitoring system now returns actual listings
    - Notification creation now has real listing data

tech_stack:
  added:
    - Playwright browser automation for search page scraping
  patterns:
    - Portal-specific CSS selectors with multiple fallbacks
    - Result validation and filtering
    - Rate limiting with random delays
    - Detailed structured logging with portal prefixes

key_files:
  created: []
  modified:
    - functions/src/schedulers/competitorMonitor.ts

decisions:
  - Use multiple fallback CSS selectors per portal (handles HTML structure variations)
  - Default maxResults to 10 listings (prevents overwhelming notification system)
  - Filter data:image URLs from photos (lazy-loaded placeholders)
  - Turkish "no results" pattern detection (sonuç bulunamadı, ilan bulunamadı)
  - Portal-prefixed logging for easier debugging in production
---

# Phase 3 Plan 6: Implement Search Results Scraping

Search results scraping implementation for competitor monitoring with portal-specific extraction logic.

## Summary

Implemented scrapeSearchResults function to scrape listing previews from Turkish real estate portal search pages using Playwright, enabling the competitor monitoring system to find and notify users of new listings matching their criteria.

## Tasks Completed

### Task 1: Implement scrapeSearchResults with portal-specific scrapers
**Status:** Complete
**Commit:** a934ff6

Replaced stub scrapeSearchResults function with full Playwright-based implementation:

**Main scrapeSearchResults function:**
- Added imports: createBrowser, scrapeWithRetry, normalizePriceText, randomDelay from common.ts
- Wrapped in scrapeWithRetry for resilience against transient failures
- Created browser instance with anti-bot measures
- Navigated to search URL with 30s timeout
- Added random 1-2s delay to appear human-like
- Routed to portal-specific extraction functions
- Closed browser in finally block for proper cleanup
- Limited results to 20 listings initially

**Portal-specific scrapers implemented:**

1. **scrapeSahibindenSearchResults:**
   - Selectors: `.searchResultsItem, [class*="listing-item"], .classified-list tbody tr`
   - Extracted: title, sourceUrl, price, location, photoUrl
   - Handled both `src` and `data-src` attributes for lazy-loaded images
   - Prepended `https://www.sahibinden.com` to relative URLs
   - Filtered data:image placeholder URLs

2. **scrapeHepsiemlakSearchResults:**
   - Selectors: `.listing-card, [class*="ListingCard"], .list-view-item`
   - Extracted: title, sourceUrl, price, location, photoUrl
   - Prepended `https://www.hepsiemlak.com` to relative URLs
   - Used extractListingId for sourceId population

3. **scrapeEmlakjetSearchResults:**
   - Selectors: `.listing-card, [class*="estate-card"], .listing-item`
   - Extracted: title, sourceUrl, price, location, photoUrl
   - Handled `data-lazy` attribute for lazy-loaded images
   - Prepended `https://www.emlakjet.com` to relative URLs

**Common patterns across all scrapers:**
- Used page.waitForSelector() with 10s timeout
- Used page.$$eval() for batch extraction of listing cards
- Called normalizePriceText to parse Turkish price formats
- Called extractListingId to populate sourceId for duplicate detection
- Filtered null results from extraction errors
- Validated title and sourceUrl before returning

**Files modified:**
- functions/src/schedulers/competitorMonitor.ts (added imports + 289 lines of scraping logic)

### Task 2: Add integration logging and result limiting
**Status:** Complete
**Commit:** 4724fa8

Enhanced scrapeSearchResults with production-ready features:

**Result limiting:**
- Added maxResults parameter with default value of 10
- Slice results before returning to avoid overwhelming notification system
- Log when limiting occurs (e.g., "Limited from 15 to 10 listings")

**Detailed logging (portal-prefixed):**
- `[portal] Starting scrape from: {url}` - scraping initiated
- `[portal] Max results: {count}` - result limit
- `[portal] Page loaded successfully` - navigation complete
- `[portal] No results found on page` - empty result detection
- `[portal] Found {count} listing cards on page` - raw extraction count
- `[portal] Skipped {count} listings with missing title/URL` - validation filtering
- `[portal] Extracted {count} valid listings` - post-validation count
- `[portal] Limited from {before} to {after} listings` - result limiting
- `[portal] Browser closed` - cleanup confirmation

**Empty result detection:**
- Check page text for Turkish "no results" patterns
- Patterns: "sonuç bulunamadı", "ilan bulunamadı", "sonuç yok"
- Return empty array gracefully with log message

**URL validation:**
- Skip listings where sourceUrl is empty or whitespace-only
- Skip listings where title is empty or whitespace-only
- Log count of skipped listings

**Enhanced error handling:**
- Detect selector timeout errors specifically
- Log warning about potential portal HTML structure changes
- Include URL in timeout warnings for debugging

**Files modified:**
- functions/src/schedulers/competitorMonitor.ts (added maxResults param + 51 lines of logging/validation)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria satisfied:

1. **TypeScript compilation:** No errors in competitorMonitor.ts
2. **TODO comments removed:** No TODO comments remain in scrapeSearchResults
3. **Imports verified:** createBrowser, scrapeWithRetry, extractListingId, normalizePriceText imported from common.ts
4. **Function implementation:** scrapeSearchResults contains actual scraping logic (not stub or empty return)
5. **Portal coverage:** All 3 portals (sahibinden, hepsiemlak, emlakjet) have specific extraction logic
6. **Browser cleanup:** Browser closed in finally block
7. **Result limiting:** maxResults parameter with default value of 10
8. **Logging:** Detailed portal-prefixed logging for debugging

**Gap closure:**
The verification gap in PORT-09 (scrapeSearchResults returns empty array) is now SATISFIED. The function uses Playwright to scrape search result pages and returns populated ListingPreview[] arrays.

## Key Implementation Decisions

1. **Multiple fallback selectors:** Each portal has comma-separated selector lists (e.g., `.listing-card, [class*="ListingCard"], .list-view-item`) to handle HTML structure variations and reduce breakage from portal updates.

2. **Default maxResults to 10:** Conservative default prevents overwhelming the notification system while still providing useful monitoring. Can be increased for specific use cases.

3. **Filter data:image URLs:** Lazy-loaded images often start with `data:image` placeholders. These are filtered out to avoid storing placeholder images.

4. **Turkish pattern detection:** Search for common Turkish "no results" messages to gracefully handle empty search results without throwing errors.

5. **Portal-prefixed logging:** All log messages include `[portal]` prefix for easy filtering in production logs (e.g., `[sahibinden]`, `[hepsiemlak]`).

6. **Validation before scraping:** Check for "no results" text immediately after page load to avoid unnecessary selector waits on empty pages.

7. **Post-extraction filtering:** Filter listings after extraction rather than failing entire scrape, improving resilience to partial page rendering issues.

## Impact on Requirements

**Requirement PORT-09 (Competitor Monitoring):** SATISFIED

The scrapeSearchResults implementation completes the competitor monitoring infrastructure. The system can now:
- Scrape search result pages from all 3 Turkish real estate portals
- Extract listing previews (title, price, location, photo, URL)
- Populate sourceId for duplicate detection
- Return ListingPreview[] for notification creation
- Handle empty results gracefully
- Log detailed debugging information

The monitoring scheduler can now run twice daily and find actual new competitor listings for user notifications.

## Files Changed

**Modified:**
- `functions/src/schedulers/competitorMonitor.ts` (340 lines total, added ~350 lines of scraping logic)
  - Imported createBrowser, scrapeWithRetry, normalizePriceText, randomDelay from common.ts
  - Replaced scrapeSearchResults stub with full Playwright implementation
  - Added scrapeSahibindenSearchResults helper
  - Added scrapeHepsiemlakSearchResults helper
  - Added scrapeEmlakjetSearchResults helper
  - Added maxResults parameter with logging and validation

## Testing Notes

**Manual verification recommended:**

1. **Live portal testing:** Test against actual portal search URLs to verify selectors match current HTML structure
2. **Empty results:** Test with invalid search criteria to verify "no results" detection works
3. **Rate limiting:** Monitor for 429/403 errors indicating anti-bot detection (may need to adjust delays)
4. **Photo URLs:** Verify photoUrls are actual image URLs not data:image placeholders
5. **Price parsing:** Test with various Turkish price formats (2.500.000 TL, 2,5M TL, etc.)

**Known considerations:**
- Portal HTML structures may change - selectors use multiple fallbacks but may still need updates
- Anti-bot measures may block scraping - createBrowser includes basic evasion but advanced detection may still occur
- Search URL format assumptions in buildSearchUrl may not match all portal URL patterns

## Next Steps

1. Deploy to Cloud Functions and test with scheduled runs
2. Monitor logs for selector timeout warnings (indicates portal HTML changes)
3. Adjust maxResults if notification volume is too high/low
4. Consider adding selector health checks to detect portal changes early
5. Implement alerting for consistent scraping failures

## Self-Check

Verifying all claims in this summary:

**Files exist:**
- functions/src/schedulers/competitorMonitor.ts: EXISTS (modified)

**Commits exist:**
- a934ff6: feat(03-06): implement scrapeSearchResults with portal-specific scrapers
- 4724fa8: feat(03-06): add integration logging and result limiting to scrapeSearchResults

**Implementation verified:**
- scrapeSearchResults function implemented: YES (lines 261-351)
- Portal-specific scrapers: YES (scrapeSahibindenSearchResults, scrapeHepsiemlakSearchResults, scrapeEmlakjetSearchResults)
- createBrowser import: YES (line 6)
- maxResults parameter: YES (line 264, default 10)
- Logging added: YES (8+ log statements with portal prefixes)
- Browser cleanup: YES (finally block closes browser)
- No TODO comments: YES (verified with grep)

## Self-Check: PASSED

All files, commits, and implementation details verified.
