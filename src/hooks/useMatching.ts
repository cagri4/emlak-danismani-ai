import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProperties } from './useProperties'
import { useCustomers } from './useCustomers'
import { PropertyMatch, CustomerMatch } from '@/types/matching'
import { findMatchesForCustomer, findMatchesForProperty } from '@/lib/matching/scoring-engine'
import { getOutcomesForCustomer, getOutcomesForProperty, recordMatchOutcome } from '@/lib/matching/feedback-tracker'
import { generateExplanation, generateCustomerExplanation } from '@/lib/matching/explanation-generator'

export function useMatching() {
  const { user } = useAuth()
  const { properties } = useProperties()
  const { customers } = useCustomers()
  const [isLoading, setIsLoading] = useState(false)

  const findPropertiesForCustomer = async (
    customerId: string,
    limit = 5
  ): Promise<PropertyMatch[]> => {
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı')
    }

    setIsLoading(true)
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) throw new Error('Müşteri bulunamadı')

      const outcomes = await getOutcomesForCustomer(user.uid, customerId)
      const matches = await findMatchesForCustomer(
        customer,
        properties,
        outcomes,
        limit
      )

      // Generate explanations for matches
      for (const match of matches) {
        match.explanation = await generateExplanation(
          customer,
          match.property,
          match.score
        )
      }

      return matches
    } finally {
      setIsLoading(false)
    }
  }

  const findCustomersForProperty = async (
    propertyId: string,
    limit = 5
  ): Promise<CustomerMatch[]> => {
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı')
    }

    setIsLoading(true)
    try {
      const property = properties.find(p => p.id === propertyId)
      if (!property) throw new Error('Mülk bulunamadı')

      const outcomes = await getOutcomesForProperty(user.uid, propertyId)
      const matches = await findMatchesForProperty(
        property,
        customers,
        outcomes,
        limit
      )

      // Generate explanations for matches
      for (const match of matches) {
        match.explanation = await generateCustomerExplanation(
          property,
          match.customer,
          match.score
        )
      }

      return matches
    } finally {
      setIsLoading(false)
    }
  }

  const recordOutcome = async (
    customerId: string,
    propertyId: string,
    liked: boolean,
    reason?: string
  ) => {
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı')
    }

    await recordMatchOutcome(user.uid, customerId, propertyId, {
      shown: true,
      liked,
      reason
    })
  }

  return {
    findPropertiesForCustomer,
    findCustomersForProperty,
    recordOutcome,
    isLoading
  }
}
