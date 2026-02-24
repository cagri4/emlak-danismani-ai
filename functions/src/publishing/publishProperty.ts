import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { PortalType, ListingData, PublishingResult } from './types';

/**
 * Cloud Function to publish property listing to Turkish real estate portals
 *
 * NOTE: Portal publishing is disabled in Cloud Functions
 * because Playwright browser automation exceeds resource limits.
 *
 * To enable full publishing:
 * - Deploy to Cloud Run with Playwright support
 * - Or use portal APIs directly (if available)
 */
export const publishProperty = onCall(
  { region: 'europe-west1', memory: '512MiB', timeoutSeconds: 30 },
  async (request) => {
    const { portal, listing, credentials } = request.data as {
      portal: PortalType;
      listing: ListingData;
      credentials: { email: string; password: string };
    };

    // Validate input
    if (!portal || !listing || !credentials) {
      throw new HttpsError(
        'invalid-argument',
        'Portal, listing, ve credentials gerekli'
      );
    }

    console.log(`Portal publishing requested for ${portal}`);
    console.log('NOTE: Browser-based publishing is currently disabled.');

    // Return informative error
    throw new HttpsError(
      'unimplemented',
      `Portal yayınlama şu anda devre dışı. ${portal} portalına manuel olarak ilan ekleyebilirsiniz.`
    );
  }
);
