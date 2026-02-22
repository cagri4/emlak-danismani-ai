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
  suggestionsSent?: boolean;
  telegramChatId?: number;
}

interface Property {
  title: string;
  price: number;
  location: { city: string; district?: string };
  type: string;
  rooms?: string;
  status: string;
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
    customerId: string;
    matchCount: number;
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
            customerId: payload.customerId,
            matchCount: payload.matchCount.toString(),
            url: `/customers/${payload.customerId}`,
          },
          webpush: {
            fcmOptions: {
              link: `/customers/${payload.customerId}`,
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
 * Firestore trigger: Suggest matching properties when a new customer is created
 */
export const suggestMatchingProperties = onDocumentCreated(
  {
    document: 'users/{userId}/customers/{customerId}',
    region: 'europe-west1'
  },
  async (event) => {
    const customer = event.data?.data() as Customer | undefined;
    if (!customer || customer.suggestionsSent) {
      return;
    }

    const userId = event.params.userId;
    const customerId = event.params.customerId;

    // Get all active properties for this user
    const db = getFirestore();
    const propertiesSnap = await db
      .collection('users').doc(userId)
      .collection('properties')
      .where('status', '==', 'aktif')
      .get();

    // Score each property against this customer
    const matches: Array<{ property: Property; propertyId: string; score: number }> = [];
    for (const doc of propertiesSnap.docs) {
      const property = doc.data() as Property;
      const score = scorePropertyForCustomer(customer, property);
      if (score >= 60) {
        matches.push({ property, propertyId: doc.id, score });
      }
    }

    // Create single notification with all suggestions
    if (matches.length > 0) {
      const topMatches = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      await db.collection('users').doc(userId)
        .collection('notifications').add({
          type: 'customer_suggestions',
          title: `${customer.name} için ${topMatches.length} mülk önerisi`,
          message: topMatches.map(m =>
            `${m.property.title} (%${m.score})`
          ).join(', '),
          data: {
            customerId,
            suggestions: topMatches.map(m => ({
              propertyId: m.propertyId,
              score: m.score
            }))
          },
          read: false,
          createdAt: new Date()
        });

      // Send FCM push notification
      await sendFCMNotification(userId, {
        title: `Yeni Müşteri: ${customer.name}`,
        body: `${topMatches.length} eşleşen mülk bulundu`,
        customerId,
        matchCount: topMatches.length,
        type: 'customer_suggestions'
      });

      // Send Telegram notification if customer has telegramChatId
      if (customer.telegramChatId) {
        const propertyList = topMatches.map((m, idx) =>
          `${idx + 1}. <b>${m.property.title}</b> - ${m.property.price.toLocaleString('tr-TR')} TL (Eşleşme: %${m.score})`
        ).join('\n');

        const telegramMessage = `👋 <b>Hoş geldiniz!</b>\n\n` +
          `Sizin için <b>${topMatches.length} mülk önerisi</b> bulundu:\n\n` +
          propertyList;

        // Fire and forget - don't await to avoid blocking trigger
        sendTelegramNotification(
          customer.telegramChatId,
          telegramMessage,
          { parseMode: 'HTML' }
        ).catch((error) => {
          console.error(`Failed to send Telegram notification for customer ${customerId}:`, error);
        });
      }
    }

    // Mark as processed
    await event.data?.ref.update({ suggestionsSent: true });
  }
);
