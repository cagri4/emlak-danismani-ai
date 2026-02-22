import { onRequest } from 'firebase-functions/v2/https';
import { db, REGION } from '../config';
import { createHmac } from 'crypto';

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    [key: string]: any;
  };
}

export const resendWebhook = onRequest(
  { region: REGION, cors: false },
  async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Get signature and webhook secret
    const signature = req.headers['svix-signature'] as string;
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.warn('Missing signature or webhook secret');
      res.status(401).send('Unauthorized');
      return;
    }

    try {
      // Verify webhook signature
      const rawBody = JSON.stringify(req.body);
      const hmac = createHmac('sha256', webhookSecret);
      const expectedSignature = hmac.update(rawBody).digest('hex');

      // Parse signature header (format: "v1=<signature>")
      const signatureParts = signature.split('v1=');
      if (signatureParts.length !== 2) {
        console.warn('Invalid signature format');
        res.status(401).send('Unauthorized');
        return;
      }

      const receivedSignature = signatureParts[1].split(',')[0]; // Get first signature if multiple

      // Compare signatures
      if (receivedSignature !== expectedSignature) {
        console.warn('Signature mismatch');
        res.status(401).send('Unauthorized');
        return;
      }

      // Process webhook event
      const event = req.body as ResendWebhookEvent;
      const { type, data } = event;
      const emailId = data.email_id;

      console.log(`Processing webhook event: ${type} for email ${emailId}`);

      // Find email document in Firestore using collectionGroup
      const emailsSnapshot = await db
        .collectionGroup('emails')
        .where('emailId', '==', emailId)
        .limit(1)
        .get();

      if (emailsSnapshot.empty) {
        console.warn(`Email not found: ${emailId}`);
        res.status(404).send('Email not found');
        return;
      }

      const emailDoc = emailsSnapshot.docs[0];

      // Determine status based on event type
      let status: string | null = null;
      switch (type) {
        case 'email.sent':
          status = 'sent'; // Already set on send, but update if needed
          break;
        case 'email.delivered':
          status = 'delivered';
          break;
        case 'email.opened':
          status = 'opened';
          break;
        case 'email.bounced':
          status = 'bounced';
          break;
        case 'email.failed':
          status = 'failed';
          break;
        case 'email.clicked':
          // Don't change status for clicks, just add to events
          status = null;
          break;
        default:
          console.log(`Unhandled event type: ${type}`);
          status = null;
      }

      // Prepare update data
      const updateData: any = {
        lastUpdated: new Date(),
        events: [
          ...(emailDoc.data().events || []),
          {
            type,
            timestamp: new Date(data.created_at),
            data,
          },
        ],
      };

      // Update status if applicable
      if (status) {
        updateData.status = status;
      }

      // Update Firestore document
      await emailDoc.ref.update(updateData);

      console.log(`Successfully processed ${type} for email ${emailId}`);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);
