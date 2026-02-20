import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MatchOutcome } from '@/types/matching'

export async function recordMatchOutcome(
  userId: string,
  customerId: string,
  propertyId: string,
  outcome: { shown: boolean; liked: boolean; reason?: string }
): Promise<void> {
  // Store in Firestore: users/{userId}/match_outcomes
  const outcomeRef = collection(db, `users/${userId}/match_outcomes`)
  await addDoc(outcomeRef, {
    customerId,
    propertyId,
    ...outcome,
    timestamp: serverTimestamp()
  })
}

export async function getOutcomesForCustomer(
  userId: string,
  customerId: string
): Promise<MatchOutcome[]> {
  const q = query(
    collection(db, `users/${userId}/match_outcomes`),
    where('customerId', '==', customerId),
    orderBy('timestamp', 'desc'),
    limit(50)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date()
  })) as MatchOutcome[]
}

export async function getOutcomesForProperty(
  userId: string,
  propertyId: string
): Promise<MatchOutcome[]> {
  const q = query(
    collection(db, `users/${userId}/match_outcomes`),
    where('propertyId', '==', propertyId),
    orderBy('timestamp', 'desc'),
    limit(50)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date()
  })) as MatchOutcome[]
}

export async function getAllOutcomes(userId: string): Promise<MatchOutcome[]> {
  const q = query(
    collection(db, `users/${userId}/match_outcomes`),
    orderBy('timestamp', 'desc'),
    limit(100)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date()
  })) as MatchOutcome[]
}
