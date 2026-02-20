import { onCall } from 'firebase-functions/v2/https';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { db, bucket, REGION } from '../config';
import { detectPortal, findSimilarProperties, type ScrapedProperty } from '../scrapers/common';
import { scrapeSahibinden } from '../scrapers/sahibinden';
import { scrapeHepsiemlak } from '../scrapers/hepsiemlak';
import { scrapeEmlakjet } from '../scrapers/emlakjet';

/**
 * Import property from URL - callable function
 * Returns scraped data and similar properties for preview
 * Does NOT save yet - just returns for user confirmation
 */
export const importPropertyFromUrl = onCall(
  {
    region: REGION,
    memory: '1GiB',
    timeoutSeconds: 60
  },
  async (request) => {
    const { url, userId } = request.data as { url: string; userId: string };

    if (!url || !userId) {
      throw new Error('URL and userId are required');
    }

    // Detect which portal the URL belongs to
    const portal = detectPortal(url);

    if (portal === 'unknown') {
      throw new Error('Desteklenmeyen portal');
    }

    try {
      // Call appropriate scraper based on portal
      let scraped: ScrapedProperty;

      switch (portal) {
        case 'sahibinden':
          scraped = await scrapeSahibinden(url);
          break;
        case 'hepsiemlak':
          scraped = await scrapeHepsiemlak(url);
          break;
        case 'emlakjet':
          scraped = await scrapeEmlakjet(url);
          break;
        default:
          throw new Error('Bilinmeyen portal');
      }

      // Find similar properties to warn about duplicates
      const similar = await findSimilarProperties(scraped, userId);

      return {
        scraped,
        similar: similar.map(p => ({
          id: p.id,
          title: p.title,
          location: p.location
        }))
      };
    } catch (error) {
      console.error('Error scraping property:', error);
      throw new Error('Property scraping failed');
    }
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
