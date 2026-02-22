import { onRequest } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import sharp from 'sharp'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = getFirestore()
const storage = getStorage()

/**
 * HTTP Cloud Function to generate optimized share images for property listings
 *
 * GET /generateShareImage?propertyId={id}&userId={userId}
 *
 * Returns a 1200x630px JPEG optimized for WhatsApp and social media previews
 *
 * MVP Implementation: Resizes property cover photo to optimal dimensions
 * Future enhancement: Add text overlay with property details
 */
export const generateShareImage = onRequest(
  {
    region: 'europe-west1', // KVKK compliance
    memory: '1GiB', // Sufficient for image processing
    timeoutSeconds: 60,
    cors: true, // Allow cross-origin requests for OG tags
  },
  async (request, response) => {
    try {
      // Get query parameters
      const { propertyId, userId } = request.query

      if (!propertyId || !userId || typeof propertyId !== 'string' || typeof userId !== 'string') {
        response.status(400).send('Missing or invalid propertyId or userId parameters')
        return
      }

      // Fetch property data from Firestore
      const propertyRef = db.doc(`users/${userId}/properties/${propertyId}`)
      const propertySnap = await propertyRef.get()

      if (!propertySnap.exists) {
        response.status(404).send('Property not found')
        return
      }

      const propertyData = propertySnap.data()

      if (!propertyData) {
        response.status(404).send('Property data not found')
        return
      }

      // Get cover photo or first photo
      const photos = propertyData.photos || []
      const coverPhoto = photos.find((p: any) => p.isCover) || photos[0]

      if (!coverPhoto || !coverPhoto.url) {
        response.status(404).send('No photos available for this property')
        return
      }

      // Extract storage path from URL
      // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
      const urlMatch = coverPhoto.url.match(/\/o\/(.+?)\?/)
      if (!urlMatch) {
        response.status(400).send('Invalid photo URL format')
        return
      }

      const encodedPath = urlMatch[1]
      const photoPath = decodeURIComponent(encodedPath)

      // Download photo from Storage
      const bucket = storage.bucket()
      const file = bucket.file(photoPath)

      const [fileExists] = await file.exists()
      if (!fileExists) {
        response.status(404).send('Photo file not found in storage')
        return
      }

      const [photoBuffer] = await file.download()

      // Generate optimized share image: 1200x630px (WhatsApp recommended size)
      const shareImageBuffer = await sharp(photoBuffer)
        .resize(1200, 630, {
          fit: 'cover', // Crop to fill dimensions
          position: 'center', // Center the crop
        })
        .jpeg({
          quality: 85, // Good balance of quality and file size
          progressive: true, // Better for web loading
        })
        .toBuffer()

      // Set cache headers (1 hour)
      response.set('Cache-Control', 'public, max-age=3600')
      response.set('Content-Type', 'image/jpeg')

      // Send the image
      response.send(shareImageBuffer)
    } catch (error) {
      console.error('Error generating share image:', error)
      response.status(500).send('Error generating share image')
    }
  }
)
