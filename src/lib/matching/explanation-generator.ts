import { Customer } from '@/types/customer'
import { Property } from '@/types/property'
import { MatchScore } from '@/types/matching'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

export async function generateExplanation(
  customer: Customer,
  property: Property,
  score: MatchScore
): Promise<string> {
  // For high scores, use template-based for speed
  if (score.score >= 80) {
    return generateHighMatchExplanation(customer, property, score)
  }

  // For lower scores, explain what's missing
  return generatePartialMatchExplanation(customer, property, score)
}

function generateHighMatchExplanation(
  _customer: Customer,
  property: Property,
  score: MatchScore
): string {
  const parts: string[] = []

  if (score.factors.locationMatch >= 25) {
    parts.push(`${property.location.city} tam istediği bölgede`)
  }

  if (score.factors.budgetMatch >= 25) {
    parts.push('bütçesine uygun')
  }

  if (score.factors.typeMatch >= 15) {
    parts.push(`${property.type} arıyordu`)
  }

  if (score.factors.roomsMatch >= 15 && property.rooms) {
    parts.push(`${property.rooms} istemişti`)
  }

  return parts.join(', ') + '.'
}

function generatePartialMatchExplanation(
  customer: Customer,
  property: Property,
  score: MatchScore
): string {
  const pros: string[] = []
  const cons: string[] = []

  if (score.factors.locationMatch >= 20) {
    pros.push('Konum uyuyor')
  } else {
    cons.push(`${customer.preferences.location.join(' veya ')} istiyor ama bu ${property.location.city}'da`)
  }

  if (score.factors.budgetMatch >= 20) {
    pros.push('bütçesine uygun')
  } else {
    const { min, max } = customer.preferences.budget
    cons.push(`${formatPrice(min)}-${formatPrice(max)} arıyor ama bu ${formatPrice(property.price)}`)
  }

  if (score.factors.typeMatch >= 15) {
    pros.push(`${property.type} istiyor`)
  } else {
    cons.push(`${customer.preferences.propertyType.join('/')} istiyor ama bu ${property.type}`)
  }

  if (score.factors.roomsMatch >= 15 && property.rooms) {
    pros.push(`${property.rooms} uyuyor`)
  } else if (customer.preferences.rooms && customer.preferences.rooms.length > 0 && property.rooms) {
    cons.push(`${customer.preferences.rooms.join('/')} istiyor ama bu ${property.rooms}`)
  }

  // Construct explanation
  let explanation = ''
  if (pros.length > 0) {
    explanation += pros.join(', ')
  }
  if (cons.length > 0) {
    explanation += (pros.length > 0 ? ', ama ' : '') + cons.join(', ')
  }

  return explanation + '.'
}

export function generateNoMatchExplanation(
  customer: Customer,
  properties: Property[]
): string {
  if (properties.length === 0) {
    return `Şu anda ${customer.preferences.location.join(' veya ')} bölgesinde ${customer.preferences.propertyType.join('/')} bulunamadı. Yeni mülkler eklendikçe sana bildiririm.`
  }

  // Analyze why no matches
  const budgetTooLow = properties.every(p =>
    p.price > customer.preferences.budget.max
  )

  const budgetTooHigh = properties.every(p =>
    p.price < customer.preferences.budget.min
  )

  if (budgetTooLow) {
    return `Bu fiyat aralığında (${formatPrice(customer.preferences.budget.min)}-${formatPrice(customer.preferences.budget.max)}) uygun mülk bulunamadı. Bütçeyi artırırsan daha çok seçenek görebilirsin.`
  }

  if (budgetTooHigh) {
    return `Bu fiyat aralığında (${formatPrice(customer.preferences.budget.min)}-${formatPrice(customer.preferences.budget.max)}) uygun mülk bulunamadı. Daha düşük bütçeli mülkler mevcut.`
  }

  return `Şu anda ${customer.preferences.location.join(' veya ')} bölgesinde ${customer.preferences.propertyType.join('/')} bulunamadı. Yeni mülkler eklendikçe sana bildiririm.`
}

export function generateCustomerExplanation(
  property: Property,
  customer: Customer,
  score: MatchScore
): string {
  // Explanation from property perspective: why this customer might be interested
  if (score.score >= 80) {
    const parts: string[] = []

    if (score.factors.locationMatch >= 25) {
      parts.push(`${property.location.city} arıyor`)
    }

    if (score.factors.budgetMatch >= 25) {
      parts.push('bütçesi uyuyor')
    }

    if (score.factors.typeMatch >= 15) {
      parts.push(`${property.type} istiyor`)
    }

    return parts.join(', ') + '.'
  }

  // Partial match
  const pros: string[] = []
  const cons: string[] = []

  if (score.factors.locationMatch >= 20) {
    pros.push('Bölge uyuyor')
  } else {
    cons.push(`${customer.preferences.location.join(' veya ')} arıyor`)
  }

  if (score.factors.budgetMatch >= 20) {
    pros.push('bütçesi uyuyor')
  } else {
    cons.push(`bütçesi ${formatPrice(customer.preferences.budget.min)}-${formatPrice(customer.preferences.budget.max)}`)
  }

  let explanation = ''
  if (pros.length > 0) {
    explanation += pros.join(', ')
  }
  if (cons.length > 0) {
    explanation += (pros.length > 0 ? ', ama ' : '') + cons.join(', ')
  }

  return explanation + '.'
}
