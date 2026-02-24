import { onSchedule } from 'firebase-functions/v2/scheduler';

/**
 * Competitor monitoring scheduled function
 *
 * NOTE: Browser-based scraping is disabled in Cloud Functions
 * because Playwright requires browser binaries that exceed resource limits.
 *
 * This function is a placeholder that logs when it would have run.
 * To enable full competitor monitoring:
 * - Deploy scraping to Cloud Run with Playwright support
 * - Or integrate with an external scraping API service
 */
export const monitorCompetitors = onSchedule(
  {
    schedule: '0 9,21 * * *', // 9 AM and 9 PM
    timeZone: 'Europe/Istanbul',
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30
  },
  async () => {
    console.log('Competitor monitoring triggered at', new Date().toISOString());
    console.log('NOTE: Browser-based scraping is currently disabled.');
    console.log('To enable: deploy scraping service to Cloud Run or use external API.');

    // This is a placeholder - actual monitoring disabled
    // In a full implementation, this would:
    // 1. Fetch user monitoring criteria
    // 2. Query external scraping service
    // 3. Create notifications for new listings
  }
);
