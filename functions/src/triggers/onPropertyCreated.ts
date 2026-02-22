import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { sendTelegramNotification } from '../telegram/notifications';

/**
 * Simplified scoring function for Cloud Functions
 * Duplicated from client scoring-engine.ts for isolation
 */
interface ScoringFactors {
  locationMatch: number;
  budgetMatch: number;
  typeMatch: number;
  roomsMatch: number;
}

interface CustomerPreferences {
  location: string[];
  budget: { min: number; max: number };
  propertyType: string[];
  rooms?: string[];
}

interface Customer {
  name: string;
  preferences: CustomerPreferences;
  telegramChatId?: number;
}

interface Property {
  title: string;
  price: number;
  location: { city: string; district?: string };
  type: string;
  rooms?: string;
  status: string;
  matchNotificationsSent?: boolean;
}

function scorePropertyForCustomer(customer: Customer, property: Property): number {
  const factors: ScoringFactors = {
    locationMatch: 0,
    budgetMatch: 0,
    typeMatch: 0,
    roomsMatch: 0
  };

  // Location (30% weight)
  if (customer.preferences.location.includes(property.location.city)) {
    factors.locationMatch = 30;
  } else if (property.location.district && customer.preferences.location.some(loc =>
    property.location.district?.toLowerCase().includes(loc.toLowerCase())
  )) {
    factors.locationMatch = 20; // Partial match
  }

  // Budget (30% weight)
  const { min, max } = customer.preferences.budget;
  if (property.price >= min && property.price <= max) {
    factors.budgetMatch = 30;
  } else if (property.price >= min * 0.9 && property.price <= max * 1.1) {
    factors.budgetMatch = 15; // Within 10% tolerance
  }

  // Property type (20% weight)
  if (customer.preferences.propertyType.includes(property.type)) {
    factors.typeMatch = 20;
  }

  // Rooms (20% weight)
  if (customer.preferences.rooms?.includes(property.rooms || '')) {
    factors.roomsMatch = 20;
  } else if (!customer.preferences.rooms || customer.preferences.rooms.length === 0) {
    factors.roomsMatch = 10; // No preference = partial match
  }

  const score = Object.values(factors).reduce((sum, val) => sum + val, 0);
  return Math.max(0, Math.min(100, score));
}

/**
 * Send FCM push notification to all user's registered devices
 * Fire-and-forget pattern - errors logged but don't block trigger
 */
async function sendFCMNotification(
  userId: string,
  payload: {
    title: string;
    body: string;
    propertyId: string;
    customerId: string;
    type: string;
  }
): Promise<void> {
  try {
    const db = getFirestore();
    const messaging = getMessaging();

    // Get all FCM tokens for this user
    const tokensSnap = await db
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    if (tokensSnap.empty) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }

    // Send to all tokens (fire-and-forget)
    const sendPromises = tokensSnap.docs.map(async (tokenDoc) => {
      const tokenData = tokenDoc.data();
      const token = tokenData.token;

      try {
        await messaging.send({
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            type: payload.type,
            propertyId: payload.propertyId,
            customerId: payload.customerId,
            url: `/properties/${payload.propertyId}`,
          },
          webpush: {
            fcmOptions: {
              link: `/properties/${payload.propertyId}`,
            },
          },
        });

        console.log(`FCM sent to token ${token.substring(0, 20)}...`);
      } catch (error: any) {
        console.error(`Error sending FCM to token ${token.substring(0, 20)}...:`, error);

        // Clean up invalid tokens
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          console.log(`Removing invalid token ${token.substring(0, 20)}...`);
          await tokenDoc.ref.delete();
        }
      }
    });

    // Don't await - fire and forget
    Promise.all(sendPromises).catch((error) => {
      console.error('Error in FCM batch send:', error);
    });
  } catch (error) {
    console.error('Error in sendFCMNotification:', error);
  }
}

/**
 * Firestore trigger: Notify matching customers when a new property is created
 */
export const notifyMatchingCustomers = onDocumentCreated(
  {
    document: 'users/{userId}/properties/{propertyId}',
    region: 'europe-west1'
  },
  async (event) => {
    // Idempotency check
    const property = event.data?.data() as Property | undefined;
    if (!property || property.matchNotificationsSent) {
      return;
    }

    const userId = event.params.userId;
    const propertyId = event.params.propertyId;

    // Get all customers for this user
    const db = getFirestore();
    const customersSnap = await db
      .collection('users').doc(userId)
      .collection('customers')
      .get();

    // Score each customer against this property
    const matches: Array<{ customer: Customer; customerId: string; score: number }> = [];
    for (const doc of customersSnap.docs) {
      const customer = doc.data() as Customer;
      const score = scorePropertyForCustomer(customer, property);
      if (score >= 60) { // 60% threshold
        matches.push({ customer, customerId: doc.id, score });
      }
    }

    // Sort by score descending and take top 5
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 5);

    // Create notifications for top matches
    for (const match of topMatches) {
      await db.collection('users').doc(userId)
        .collection('notifications').add({
          type: 'property_match',
          title: `Yeni mülk: ${property.title}`,
          message: `${match.customer.name} için %${match.score} eşleşen mülk eklendi`,
          data: {
            propertyId,
            customerId: match.customerId,
            score: match.score
          },
          read: false,
          createdAt: new Date()
        });

      // Send FCM push notifications to user's devices
      await sendFCMNotification(userId, {
        title: `Yeni Mülk: ${property.title}`,
        body: `${match.customer.name} için %${match.score} eşleşen mülk eklendi`,
        propertyId,
        customerId: match.customerId,
        type: 'property_match'
      });

      // Send Telegram notification if customer has telegramChatId
      if (match.customer.telegramChatId) {
        const telegramMessage = `🏠 <b>Yeni Mülk Eşleşmesi!</b>\n\n` +
          `<b>${property.title}</b>\n` +
          `📍 ${property.location.city}${property.location.district ? ' - ' + property.location.district : ''}\n` +
          `💰 ${property.price.toLocaleString('tr-TR')} TL\n` +
          `📊 Eşleşme: %${match.score}`;

        // Fire and forget - don't await to avoid blocking trigger
        sendTelegramNotification(
          match.customer.telegramChatId,
          telegramMessage,
          { parseMode: 'HTML' }
        ).catch((error) => {
          console.error(`Failed to send Telegram notification for customer ${match.customerId}:`, error);
        });
      }
    }

    // Mark as processed (idempotency)
    await event.data?.ref.update({ matchNotificationsSent: true });
  }
);
