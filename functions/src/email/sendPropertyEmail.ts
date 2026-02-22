import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Resend } from 'resend';
import { db, REGION } from '../config';
import PropertyEmail from './templates/PropertyEmail';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPropertyEmailRequest {
  customerId: string;
  propertyId: string;
}

export const sendPropertyEmail = onCall(
  { region: REGION },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı');
    }

    const userId = request.auth.uid;
    const { customerId, propertyId } = request.data as SendPropertyEmailRequest;

    // Validate input
    if (!customerId || !propertyId) {
      throw new HttpsError(
        'invalid-argument',
        'customerId ve propertyId gerekli'
      );
    }

    try {
      // Fetch customer
      const customerDoc = await db
        .collection('users')
        .doc(userId)
        .collection('customers')
        .doc(customerId)
        .get();

      if (!customerDoc.exists) {
        throw new HttpsError('not-found', 'Müşteri bulunamadı');
      }

      const customer = customerDoc.data();

      // Validate customer email
      if (!customer?.email) {
        throw new HttpsError(
          'failed-precondition',
          'Müşterinin e-posta adresi yok'
        );
      }

      // Fetch property
      const propertyDoc = await db
        .collection('users')
        .doc(userId)
        .collection('properties')
        .doc(propertyId)
        .get();

      if (!propertyDoc.exists) {
        throw new HttpsError('not-found', 'Mülk bulunamadı');
      }

      const property = propertyDoc.data();

      if (!property) {
        throw new HttpsError('not-found', 'Mülk verisi bulunamadı');
      }

      // Send email via Resend
      const { data, error } = await resend.emails.send({
        from: 'Emlak Danışmanı <noreply@resend.dev>',
        to: customer.email,
        subject: `Mülk Önerisi: ${property.title}`,
        react: PropertyEmail({
          customerName: customer.name,
          property: {
            title: property.title,
            price: property.price,
            location: property.location,
            propertyType: property.propertyType,
            rooms: property.rooms,
            area: property.area,
            photos: property.photos,
            description: property.description,
          },
        }),
        tags: [
          { name: 'type', value: 'property_email' },
          { name: 'customer_id', value: customerId },
          { name: 'property_id', value: propertyId },
        ],
      });

      if (error) {
        throw new HttpsError('internal', error.message);
      }

      // Store email record in Firestore
      await db
        .collection('users')
        .doc(userId)
        .collection('customers')
        .doc(customerId)
        .collection('emails')
        .add({
          emailId: data?.id,
          propertyId,
          subject: `Mülk Önerisi: ${property.title}`,
          status: 'sent',
          sentAt: new Date(),
          events: [],
        });

      return {
        success: true,
        emailId: data?.id,
      };
    } catch (error: any) {
      // Re-throw HttpsError
      if (error instanceof HttpsError) {
        throw error;
      }

      // Wrap unknown errors
      throw new HttpsError(
        'internal',
        `E-posta gönderilemedi: ${error.message}`
      );
    }
  }
);
