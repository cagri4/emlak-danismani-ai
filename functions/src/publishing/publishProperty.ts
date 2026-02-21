import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { publishToSahibinden } from './publishers/sahibinden';
import { publishToHepsiemlak } from './publishers/hepsiemlak';
import { publishToEmlakjet } from './publishers/emlakjet';
import { generatePortalPhotos } from './photoResizer';
import { PortalType, ListingData, PublishingResult } from './types';

/**
 * Cloud Function to publish property listing to Turkish real estate portals
 *
 * This function:
 * - Resizes photos to portal specifications
 * - Routes to portal-specific publisher
 * - Returns success/failure with portal listing ID/URL
 *
 * Usage from Telegram bot or client app:
 * ```
 * const result = await publishProperty({
 *   portal: 'sahibinden',
 *   listing: { propertyId, title, description, ... },
 *   credentials: { email, password }
 * });
 * ```
 */
export const publishProperty = onCall(
  { region: 'europe-west1', memory: '2GiB', timeoutSeconds: 300 },
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

    // Resize photos for portal
    console.log(`Resizing ${listing.photoUrls.length} photos for ${portal}...`);
    const resizedPhotos = await generatePortalPhotos(listing.photoUrls, portal);
    console.log(`Resized ${resizedPhotos.length} photos for ${portal}`);

    // Publish to selected portal
    let result: PublishingResult;
    switch (portal) {
      case 'sahibinden':
        result = await publishToSahibinden(listing, credentials);
        break;
      case 'hepsiemlak':
        result = await publishToHepsiemlak(listing, credentials);
        break;
      case 'emlakjet':
        result = await publishToEmlakjet(listing, credentials);
        break;
      default:
        throw new HttpsError('invalid-argument', `Gecersiz portal: ${portal}`);
    }

    return result;
  }
);
