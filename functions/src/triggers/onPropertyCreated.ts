import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';

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
    }

    // Mark as processed (idempotency)
    await event.data?.ref.update({ matchNotificationsSent: true });
  }
);
