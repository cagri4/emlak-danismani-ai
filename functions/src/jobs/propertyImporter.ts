import { onCall } from 'firebase-functions/v2/https';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { db, bucket, REGION } from '../config';
import { detectPortal, extractListingId, resolveShortUrl, type ScrapedProperty } from '../scrapers/common';

/**
 * Import property from URL - callable function
 *
 * NOTE: Full scraping with Playwright is disabled in Cloud Functions
 * because it requires browser binaries that exceed resource limits.
 *
 * Current behavior: Returns a placeholder with the URL for manual entry.
 * Future: Integrate with Cloud Run or external scraping service.
 */
export const importPropertyFromUrl = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 30
  },
  async (request) => {
    const { url: rawUrl, userId } = request.data as { url: string; userId: string };

    if (!rawUrl || !userId) {
      throw new Error('URL and userId are required');
    }

    // Resolve short URLs (e.g., shbd.io -> sahibinden.com)
    const url = await resolveShortUrl(rawUrl);

    // Detect which portal the URL belongs to
    const portal = detectPortal(url);

    if (portal === 'unknown') {
      throw new Error('Desteklenmeyen portal. Sahibinden, Hepsiemlak veya Emlakjet URL\'i girin.');
    }

    // Extract listing ID from URL
    const sourceId = extractListingId(url, portal);

    // Return placeholder data - user will need to fill in details manually
    // Full scraping requires browser automation which isn't available in Cloud Functions
    const placeholder: ScrapedProperty = {
      title: `${portal.charAt(0).toUpperCase() + portal.slice(1)} İlanı`,
      price: 0,
      currency: 'TRY',
      propertyType: 'daire',
      location: {
        city: '',
        district: '',
        fullAddress: ''
      },
      photoUrls: [],
      sourceUrl: url,
      sourcePortal: portal,
      sourceId
    };

    console.log(`Portal import requested for ${portal}: ${url}`);

    return {
      scraped: placeholder,
      similar: [],
      message: 'Otomatik veri çekme şu anda devre dışı. Lütfen ilan bilgilerini manuel olarak girin.',
      manualEntryRequired: true
    };
  }
);

/**
 * Process property import - task queue handler
 * Triggered after user confirms import
 * Creates property document and optionally downloads photos
 */
export const processPropertyImport = onTaskDispatched(
  {
    region: REGION,
    retryConfig: {
      maxAttempts: 3,
      maxRetrySeconds: 600
    },
    rateLimits: {
      maxConcurrentDispatches: 5
    }
  },
  async (request) => {
    const { scraped, userId, photoDownload } = request.data as {
      scraped: ScrapedProperty;
      userId: string;
      photoDownload: boolean;
    };

    try {
      // Create property document in Firestore
      const propertyRef = db.collection('users').doc(userId).collection('properties').doc();

      const propertyData: any = {
        title: scraped.title,
        type: scraped.propertyType === 'other' ? 'daire' : scraped.propertyType,
        listingType: 'satılık',
        status: 'aktif',
        price: scraped.price,
        location: {
          city: scraped.location.city,
          district: scraped.location.district || '',
          neighborhood: scraped.location.neighborhood
        },
        area: scraped.area || 0,
        rooms: scraped.rooms,
        features: scraped.features || [],
        description: scraped.description,
        photos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        sourceUrl: scraped.sourceUrl,
        sourcePortal: scraped.sourcePortal,
        sourceId: scraped.sourceId
      };

      // If photo download is requested, download and upload photos
      if (photoDownload && scraped.photoUrls && scraped.photoUrls.length > 0) {
        const uploadedPhotos: string[] = [];

        for (const photoUrl of scraped.photoUrls.slice(0, 10)) {
          try {
            const response = await fetch(photoUrl);
            if (!response.ok) continue;

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const fileName = 'property-photos/' + userId + '/' + propertyRef.id + '/' + Date.now() + '.jpg';

            const file = bucket.file(fileName);
            await file.save(buffer, {
              contentType: 'image/jpeg',
              metadata: {
                metadata: {
                  propertyId: propertyRef.id,
                  sourceUrl: photoUrl
                }
              }
            });

            await file.makePublic();

            const publicUrl = 'https://storage.googleapis.com/' + bucket.name + '/' + fileName;
            uploadedPhotos.push(publicUrl);
          } catch (photoError) {
            console.error('Error downloading photo:', photoError);
          }
        }

        propertyData.photos = uploadedPhotos;
      }

      await propertyRef.set(propertyData);

      console.log('Property imported successfully:', propertyRef.id);

      // Task completed successfully
      console.log('Task completed with property ID:', propertyRef.id);
    } catch (error) {
      console.error('Error processing property import:', error);
      throw error;
    }
  }
);
