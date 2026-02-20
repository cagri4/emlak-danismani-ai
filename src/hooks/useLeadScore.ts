import { useState, useEffect } from 'react'
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Customer } from '@/types/customer'
import { MatchOutcome } from '@/types/matching'
import { calculateLeadScore, getLeadTemperature, buildScoringSignal } from '@/lib/scoring/leadScorer'
import { getOutcomesForCustomer } from '@/lib/matching/feedback-tracker'

interface UseLeadScoreReturn {
  score: number | null
  temperature: 'hot' | 'warm' | 'cold' | null
  recalculate: () => Promise<void>
  toggleBoost: () => Promise<void>
  isLoading: boolean
}

/**
 * Hook to manage lead scores for a specific customer
 *
 * Provides:
 * - Current score and temperature
 * - Recalculate function (call after new interactions)
 * - Toggle boost function (manual priority marking)
 */
export function useLeadScore(customerId?: string): UseLeadScoreReturn {
  const { user } = useAuth()
  const [score, setScore] = useState<number | null>(null)
  const [temperature, setTemperature] = useState<'hot' | 'warm' | 'cold' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!customerId || !user) {
      setScore(null)
      setTemperature(null)
      return
    }

    // Load current score from customer document
    const loadScore = async () => {
      try {
        const customerRef = doc(db, 'users', user.uid, 'customers', customerId)
        const customerSnap = await getDoc(customerRef)

        if (customerSnap.exists()) {
          const data = customerSnap.data()
          setScore(data.leadScore ?? null)
          setTemperature(data.leadTemperature ?? null)
        }
      } catch (err) {
        console.error('Error loading lead score:', err)
      }
    }

    loadScore()
  }, [customerId, user])

  const recalculate = async () => {
    if (!customerId || !user) {
      throw new Error('Müşteri ID veya kullanıcı oturumu bulunamadı')
    }

    setIsLoading(true)
    try {
      // Fetch customer data
      const customerRef = doc(db, 'users', user.uid, 'customers', customerId)
      const customerSnap = await getDoc(customerRef)

      if (!customerSnap.exists()) {
        throw new Error('Müşteri bulunamadı')
      }

      const customer: Customer = {
        id: customerSnap.id,
        ...customerSnap.data(),
        createdAt: customerSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: customerSnap.data().updatedAt?.toDate() || new Date(),
        lastInteraction: customerSnap.data().lastInteraction?.toDate(),
      } as Customer

      // Fetch match outcomes for customer
      const outcomes: MatchOutcome[] = await getOutcomesForCustomer(user.uid, customerId)

      // Build signal and calculate score
      const signal = buildScoringSignal(customer, outcomes)
      const newScore = calculateLeadScore(signal)
      const newTemperature = getLeadTemperature(newScore)

      // Update customer document with new score
      await updateDoc(customerRef, {
        leadScore: newScore,
        leadTemperature: newTemperature,
        lastScoreUpdate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setScore(newScore)
      setTemperature(newTemperature)
    } catch (err) {
      console.error('Error recalculating lead score:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBoost = async () => {
    if (!customerId || !user) {
      throw new Error('Müşteri ID veya kullanıcı oturumu bulunamadı')
    }

    setIsLoading(true)
    try {
      // Get current boost state
      const customerRef = doc(db, 'users', user.uid, 'customers', customerId)
      const customerSnap = await getDoc(customerRef)

      if (!customerSnap.exists()) {
        throw new Error('Müşteri bulunamadı')
      }

      const currentBoost = customerSnap.data().isBoosted || false

      // Toggle boost
      await updateDoc(customerRef, {
        isBoosted: !currentBoost,
        updatedAt: serverTimestamp(),
      })

      // Recalculate score after toggle
      await recalculate()
    } catch (err) {
      console.error('Error toggling boost:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    score,
    temperature,
    recalculate,
    toggleBoost,
    isLoading,
  }
}

/**
 * Hook to calculate scores for multiple customers efficiently
 * Useful for list views
 */
export function useLeadScores(customers: Customer[]): Map<string, { score: number; temperature: 'hot' | 'warm' | 'cold' }> {
  const { user } = useAuth()
  const [scores, setScores] = useState<Map<string, { score: number; temperature: 'hot' | 'warm' | 'cold' }>>(new Map())

  useEffect(() => {
    if (!user || customers.length === 0) {
      setScores(new Map())
      return
    }

    const calculateScores = async () => {
      const newScores = new Map<string, { score: number; temperature: 'hot' | 'warm' | 'cold' }>()

      // Calculate score for each customer
      for (const customer of customers) {
        try {
          // Use existing score if available and recent (less than 1 hour old)
          if (customer.leadScore !== undefined && customer.lastScoreUpdate) {
            const lastUpdate = customer.lastScoreUpdate instanceof Date
              ? customer.lastScoreUpdate
              : customer.lastScoreUpdate.toDate()

            const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)

            if (hoursSinceUpdate < 1 && customer.leadTemperature) {
              newScores.set(customer.id, {
                score: customer.leadScore,
                temperature: customer.leadTemperature,
              })
              continue
            }
          }

          // Fetch outcomes and calculate fresh score
          const outcomes = await getOutcomesForCustomer(user.uid, customer.id)
          const signal = buildScoringSignal(customer, outcomes)
          const score = calculateLeadScore(signal)
          const temperature = getLeadTemperature(score)

          newScores.set(customer.id, { score, temperature })
        } catch (err) {
          console.error(`Error calculating score for customer ${customer.id}:`, err)
        }
      }

      setScores(newScores)
    }

    calculateScores()
  }, [user, customers])

  return scores
}
