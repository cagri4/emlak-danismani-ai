import type { IntentResult } from './structured-schemas'
import type { Property, PropertyFormData } from '@/types/property'
import type { Customer, CustomerFormData } from '@/types/customer'
import { validateCommandEntities } from './command-parser'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

/**
 * Command execution context - hooks and data access
 */
export interface CommandContext {
  userId: string
  // Property hooks
  properties: Property[]
  addProperty: (data: PropertyFormData) => Promise<{ success: boolean; id?: string; error?: string }>
  updateProperty: (id: string, data: Partial<PropertyFormData>) => Promise<{ success: boolean; error?: string }>
  getProperty: (id: string) => Promise<{ success: boolean; property?: Property; error?: string }>
  // Customer hooks
  customers: Customer[]
  addCustomer: (data: CustomerFormData) => Promise<{ success: boolean; id?: string; error?: string }>
  updateCustomer: (id: string, data: Partial<CustomerFormData>) => Promise<{ success: boolean; error?: string }>
  getCustomer: (id: string) => Promise<{ success: boolean; customer?: Customer; error?: string }>
  addInteraction: (customerId: string, interaction: any) => Promise<{ success: boolean; error?: string }>
  // Matching hooks
  findPropertiesForCustomer: (customerId: string, limit?: number) => Promise<any[]>
  findCustomersForProperty: (propertyId: string, limit?: number) => Promise<any[]>
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean
  message: string
  needsConfirmation?: boolean
  confirmationData?: any
  // Embedded data for chat display
  propertyId?: string
  customerId?: string
  matches?: Array<{
    propertyId: string
    customerId: string
    score: number
    explanation: string
  }>
  error?: string
}

/**
 * Handle parsed commands and execute appropriate actions
 */
export async function handleCommand(
  intent: string,
  entities: IntentResult['entities'],
  context: CommandContext,
  pendingConfirmation?: any
): Promise<CommandResult> {
  // Validate required entities
  const validation = validateCommandEntities(intent, entities)
  if (!validation.valid) {
    return {
      success: false,
      message: `Bazı bilgiler eksik: ${validation.missing?.join(', ')}. Lütfen daha fazla detay verin.`,
      error: 'Missing required entities'
    }
  }

  switch (intent) {
    case 'add_property':
      return handleAddProperty(entities, context, pendingConfirmation)

    case 'add_customer':
      return handleAddCustomer(entities, context, pendingConfirmation)

    case 'search_properties':
      return handleSearchProperties(entities, context)

    case 'search_customers':
      return handleSearchCustomers(entities, context)

    case 'update_status':
      return handleUpdateStatus(entities, context, pendingConfirmation)

    case 'add_note':
      return handleAddNote(entities, context)

    case 'request_matches':
      return handleRequestMatches(entities, context)

    case 'edit_description':
      return handleEditDescription(entities, context, pendingConfirmation)


    case 'import_property':
      return handleImportProperty(entities, context, pendingConfirmation)
    case 'confirm_action':
      return handleConfirmAction(pendingConfirmation, context)

    case 'cancel_action':
      return handleCancelAction()

    case 'general_chat':
      return {
        success: true,
        message: 'Size nasıl yardımcı olabilirim? Mülk ekleyebilir, müşteri ekleyebilir, arama yapabilir veya eşleştirme isteyebilirsiniz.'
      }

    default:
      return {
        success: false,
        message: 'Bu komutu anlayamadım. Lütfen farklı şekilde ifade eder misiniz?',
        error: 'Unknown intent'
      }
  }
}

/**
 * Handle add property command
 */
async function handleAddProperty(
  entities: IntentResult['entities'],
  context: CommandContext,
  pendingConfirmation?: any
): Promise<CommandResult> {
  if (!entities) {
    return { success: false, message: 'Mülk bilgileri eksik.', error: 'No entities' }
  }

  // If confirming, execute the action
  if (pendingConfirmation?.action === 'add_property') {
    const propertyData: PropertyFormData = removeUndefined(pendingConfirmation.data)
    const result = await context.addProperty(propertyData)

    if (result.success) {
      return {
        success: true,
        message: 'Mülk başarıyla eklendi! 🏠',
        propertyId: result.id
      }
    } else {
      return {
        success: false,
        message: `Mülk eklenirken hata oluştu: ${result.error}`,
        error: result.error
      }
    }
  }

  // Build property data
  const propertyData: PropertyFormData = {
    title: buildPropertyTitle(entities),
    type: mapPropertyType(entities.propertyType || 'daire'),
    listingType: 'satılık', // Default, can be inferred from context
    status: 'aktif',
    price: entities.price?.value || 0,
    location: {
      city: entities.location?.city || '',
      district: entities.location?.district || '',
      neighborhood: entities.location?.neighborhood
    },
    area: entities.area?.value || 0,
    rooms: entities.rooms,
    features: [],
  }

  // Ask for confirmation - clean undefined values before storing
  const cleanedPropertyData = removeUndefined(propertyData)
  return {
    success: true,
    message: buildPropertyConfirmation(cleanedPropertyData),
    needsConfirmation: true,
    confirmationData: {
      action: 'add_property',
      data: cleanedPropertyData
    }
  }
}

/**
 * Handle add customer command
 */
async function handleAddCustomer(
  entities: IntentResult['entities'],
  context: CommandContext,
  pendingConfirmation?: any
): Promise<CommandResult> {
  if (!entities?.customerName) {
    return { success: false, message: 'Müşteri adı belirtilmedi.', error: 'No customer name' }
  }

  // If confirming, execute the action
  if (pendingConfirmation?.action === 'add_customer') {
    const customerData: CustomerFormData = removeUndefined(pendingConfirmation.data)
    const result = await context.addCustomer(customerData)

    if (result.success) {
      return {
        success: true,
        message: `${customerData.name} başarıyla müşteri olarak eklendi! 👤`,
        customerId: result.id
      }
    } else {
      return {
        success: false,
        message: `Müşteri eklenirken hata oluştu: ${result.error}`,
        error: result.error
      }
    }
  }

  // Build customer data
  const customerData: CustomerFormData = {
    name: entities.customerName,
    phone: entities.customerPhone,
    preferences: {
      location: entities.location?.city ? [entities.location.city] : [],
      budget: {
        min: entities.budget?.min || 0,
        max: entities.budget?.max || 0
      },
      propertyType: entities.propertyType ? [entities.propertyType] : [],
      urgency: 'medium'
    }
  }

  // Ask for confirmation - clean undefined values before storing
  const cleanedCustomerData = removeUndefined(customerData)
  return {
    success: true,
    message: buildCustomerConfirmation(cleanedCustomerData),
    needsConfirmation: true,
    confirmationData: {
      action: 'add_customer',
      data: cleanedCustomerData
    }
  }
}

/**
 * Handle search properties command
 */
async function handleSearchProperties(
  entities: IntentResult['entities'],
  context: CommandContext
): Promise<CommandResult> {
  // If no properties loaded, inform user
  if (context.properties.length === 0) {
    return {
      success: true,
      message: 'Henüz mülk eklenmemiş. "Mülk ekle" komutuyla yeni mülk ekleyebilirsiniz.'
    }
  }

  // Filter properties based on search criteria
  let results = [...context.properties]

  // Location search: check city, district, and neighborhood for flexibility
  // User might say "Bodrum" which could be city or district
  if (entities?.location?.city) {
    const searchTerm = entities.location.city.toLowerCase()
    results = results.filter(p =>
      p.location.city.toLowerCase().includes(searchTerm) ||
      p.location.district.toLowerCase().includes(searchTerm) ||
      (p.location.neighborhood?.toLowerCase().includes(searchTerm) ?? false)
    )
  }

  if (entities?.location?.district) {
    const searchTerm = entities.location.district.toLowerCase()
    results = results.filter(p =>
      p.location.district.toLowerCase().includes(searchTerm) ||
      (p.location.neighborhood?.toLowerCase().includes(searchTerm) ?? false)
    )
  }

  if (entities?.propertyType) {
    const normalizedType = mapPropertyType(entities.propertyType)
    results = results.filter(p => p.type === normalizedType)
  }

  if (entities?.rooms) {
    results = results.filter(p => p.rooms === entities.rooms)
  }

  if (entities?.price?.min) {
    results = results.filter(p => p.price >= entities.price!.min!)
  }

  if (entities?.price?.max) {
    results = results.filter(p => p.price <= entities.price!.max!)
  }

  if (entities?.area?.min) {
    results = results.filter(p => p.area >= entities.area!.min!)
  }

  if (entities?.area?.max) {
    results = results.filter(p => p.area <= entities.area!.max!)
  }

  if (results.length === 0) {
    return {
      success: true,
      message: 'Bu kriterlere uygun mülk bulunamadı. Farklı kriterler denemek ister misiniz?'
    }
  }

  if (results.length === 1) {
    return {
      success: true,
      message: `1 mülk buldum:`,
      propertyId: results[0].id
    }
  }

  return {
    success: true,
    message: `${results.length} mülk buldum. İşte ilk ${Math.min(5, results.length)} tanesi:`,
    matches: results.slice(0, 5).map((p, idx) => ({
      propertyId: p.id,
      customerId: '',
      score: 100 - idx * 5,
      explanation: `${p.type} - ${p.location.district}, ${p.location.city} - ${formatPrice(p.price)}`
    }))
  }
}

/**
 * Handle search customers command
 */
async function handleSearchCustomers(
  entities: IntentResult['entities'],
  context: CommandContext
): Promise<CommandResult> {
  let results = [...context.customers]

  if (entities?.customerReference) {
    results = results.filter(c =>
      c.name.toLowerCase().includes(entities.customerReference!.toLowerCase())
    )
  }

  if (entities?.budget?.min || entities?.budget?.max) {
    results = results.filter(c => {
      const hasMinMatch = !entities.budget?.min || c.preferences.budget.min >= entities.budget.min
      const hasMaxMatch = !entities.budget?.max || c.preferences.budget.max <= entities.budget.max
      return hasMinMatch && hasMaxMatch
    })
  }

  if (results.length === 0) {
    return {
      success: true,
      message: 'Bu kriterlere uygun müşteri bulunamadı.'
    }
  }

  return {
    success: true,
    message: `${results.length} müşteri buldum.`,
    customerId: results[0].id
  }
}

/**
 * Handle update status command
 */
async function handleUpdateStatus(
  entities: IntentResult['entities'],
  context: CommandContext,
  pendingConfirmation?: any
): Promise<CommandResult> {
  if (!entities?.propertyReference || !entities?.status) {
    return {
      success: false,
      message: 'Mülk referansı veya durum bilgisi eksik.',
      error: 'Missing data'
    }
  }

  // Find matching properties
  const matches = findPropertyByReference(entities.propertyReference, context.properties)

  if (matches.length === 0) {
    return {
      success: true,
      message: 'Bu referansa uygun mülk bulunamadı. Lütfen daha spesifik olun.'
    }
  }

  if (matches.length > 1 && !pendingConfirmation) {
    // Multiple matches - ask user to clarify
    return {
      success: true,
      message: buildPropertySelectionMessage(matches),
      needsConfirmation: true,
      confirmationData: {
        action: 'select_property',
        matches: matches.map(p => p.id),
        nextAction: 'update_status',
        status: entities.status
      }
    }
  }

  // Execute status update
  const propertyId = pendingConfirmation?.selectedProperty || matches[0].id
  const newStatus = mapStatus(entities.status)

  const result = await context.updateProperty(propertyId, { status: newStatus })

  if (result.success) {
    return {
      success: true,
      message: `Mülk durumu "${newStatus}" olarak güncellendi.`,
      propertyId
    }
  } else {
    return {
      success: false,
      message: `Durum güncellenirken hata oluştu: ${result.error}`,
      error: result.error
    }
  }
}

/**
 * Handle add note command
 */
async function handleAddNote(
  entities: IntentResult['entities'],
  context: CommandContext
): Promise<CommandResult> {
  if (!entities?.noteContent) {
    return { success: false, message: 'Not içeriği belirtilmedi.', error: 'No note content' }
  }

  if (!entities?.customerReference) {
    return { success: false, message: 'Hangi müşteriye not ekleyeceğinizi belirtin.', error: 'No customer' }
  }

  // Find customer
  const customer = context.customers.find(c =>
    c.name.toLowerCase().includes(entities.customerReference!.toLowerCase())
  )

  if (!customer) {
    return { success: true, message: 'Müşteri bulunamadı.' }
  }

  // Add interaction as note
  const result = await context.addInteraction(customer.id, {
    type: 'note',
    content: entities.noteContent
  })

  if (result.success) {
    return {
      success: true,
      message: `Not ${customer.name} için eklendi.`,
      customerId: customer.id
    }
  } else {
    return {
      success: false,
      message: `Not eklenirken hata oluştu: ${result.error}`,
      error: result.error
    }
  }
}

/**
 * Handle request matches command
 */
async function handleRequestMatches(
  entities: IntentResult['entities'],
  context: CommandContext
): Promise<CommandResult> {
  // Customer -> Properties matching
  if (entities?.customerReference) {
    // Search for customer by name
    const customers = context.customers.filter(c =>
      c.name.toLowerCase().includes(entities.customerReference!.toLowerCase())
    )

    if (customers.length === 0) {
      return {
        success: false,
        message: `"${entities.customerReference}" adında müşteri bulunamadı. Müşteri adını kontrol eder misin?`,
        error: 'Customer not found'
      }
    }

    if (customers.length > 1) {
      return {
        success: true,
        message: `${customers.length} müşteri buldum:\n${customers.map((c, i) =>
          `${i + 1}. ${c.name} (${formatPrice(c.preferences.budget.min)}-${formatPrice(c.preferences.budget.max)})`
        ).join('\n')}\nHangisi için arayım?`,
        needsConfirmation: true,
        confirmationData: {
          action: 'select_customer',
          options: customers.map(c => ({ id: c.id, name: c.name }))
        }
      }
    }

    // Single customer found
    const customer = customers[0]
    const matches = await context.findPropertiesForCustomer(customer.id)

    if (matches.length === 0) {
      return {
        success: true,
        message: `${customer.name} için uygun mülk bulunamadı. Tercihlerini kontrol edebilir veya yeni mülkler ekleyebilirsiniz.`
      }
    }

    return {
      success: true,
      message: `${customer.name} için ${matches.length} mülk buldum:`,
      matches: matches.map(m => ({
        propertyId: m.property.id,
        customerId: customer.id,
        score: m.score.score,
        explanation: m.explanation
      }))
    }
  }

  // Property -> Customers matching
  if (entities?.propertyReference) {
    // Find matching properties
    const properties = findPropertyByReference(entities.propertyReference, context.properties)

    if (properties.length === 0) {
      return {
        success: false,
        message: `"${entities.propertyReference}" ile eşleşen mülk bulunamadı.`,
        error: 'Property not found'
      }
    }

    if (properties.length > 1) {
      return {
        success: true,
        message: buildPropertySelectionMessage(properties),
        needsConfirmation: true,
        confirmationData: {
          action: 'select_property',
          matches: properties.map(p => p.id),
          nextAction: 'find_customers'
        }
      }
    }

    // Single property found
    const property = properties[0]
    const matches = await context.findCustomersForProperty(property.id)

    if (matches.length === 0) {
      return {
        success: true,
        message: `${property.title} için uygun müşteri bulunamadı.`
      }
    }

    return {
      success: true,
      message: `${property.title} için ${matches.length} müşteri buldum:`,
      matches: matches.map(m => ({
        propertyId: property.id,
        customerId: m.customer.id,
        score: m.score.score,
        explanation: m.explanation
      }))
    }
  }

  return {
    success: false,
    message: 'Kimin için mülk aramamı istersin? Müşteri adını veya mülk referansını söyle.',
    error: 'No reference provided'
  }
}

/**
 * Handle edit description command
 */
async function handleEditDescription(
  _entities: IntentResult['entities'],
  _context: CommandContext,
  _pendingConfirmation?: any
): Promise<CommandResult> {
  // This will be implemented in later tasks with AI description generation
  return {
    success: true,
    message: 'İlan düzenleme özelliği yakında eklenecek.'
  }
}

/**
 * Handle confirm action command
 */
async function handleConfirmAction(
  pendingConfirmation: any,
  _context: CommandContext
): Promise<CommandResult> {
  if (!pendingConfirmation) {
    return {
      success: false,
      message: 'Onaylanacak bir işlem yok.',
      error: 'No pending confirmation'
    }
  }

  // Execute based on pending action
  // This is handled by the main handler by passing pendingConfirmation
  return {
    success: true,
    message: 'İşlem onaylandı.'
  }
}

/**
 * Handle cancel action command
 */
async function handleCancelAction(): Promise<CommandResult> {
  return {
    success: true,
    message: 'İşlem iptal edildi.'
  }
}


/**
 * Handle import property from URL command
 */
async function handleImportProperty(
  entities: IntentResult['entities'],
  context: CommandContext,
  pendingConfirmation?: any
): Promise<CommandResult> {
  if (!entities?.url) {
    return {
      success: false,
      message: 'İlan URLsi belirtilmedi. Lütfen sahibinden.com, hepsiemlak.com veya emlakjet.com dan bir ilan linki paylaşın.',
      error: 'No URL provided'
    }
  }

  // If confirming, create the property
  if (pendingConfirmation?.action === 'import_property') {
    try {
      const propertyData: PropertyFormData = removeUndefined(pendingConfirmation.data)
      const result = await context.addProperty(propertyData)

      if (result.success) {
        return {
          success: true,
          message: 'İlan başarıyla içe aktarıldı!',
          propertyId: result.id
        }
      } else {
        return {
          success: false,
          message: 'İlan içe aktarılırken hata oluştu: ' + (result.error || 'Bilinmeyen hata'),
          error: result.error
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Hata oluştu',
        error: 'Import failed'
      }
    }
  }

  // Call scraper function to get property data
  try {
    const importFn = httpsCallable(functions, 'importPropertyFromUrl')

    const response: any = await importFn({
      url: entities.url,
      userId: context.userId
    })

    const { scraped, similar } = response.data

    // Build property data from scraped data
    const propertyData: PropertyFormData = {
      title: scraped.title,
      type: scraped.propertyType === 'other' ? 'daire' : scraped.propertyType,
      listingType: 'satılık',
      status: 'aktif',
      price: scraped.price,
      location: {
        city: scraped.location.city,
        district: scraped.location.district || '',
        neighborhood: scraped.location.neighborhood
      },
      area: scraped.area || 0,
      rooms: scraped.rooms,
      features: scraped.features || [],
      description: scraped.description
    }

    // Build confirmation message
    let message = 'İlan bilgileri çekildi:\n\n'
    message += '📍 ' + scraped.title + '\n'
    message += '💰 ' + formatPrice(scraped.price) + '\n'
    message += '📏 ' + (scraped.area ? scraped.area + ' m²' : 'Belirtilmedi') + '\n'
    if (scraped.rooms) message += '🏠 ' + scraped.rooms + '\n'
    message += '📸 ' + (scraped.photoUrls?.length || 0) + ' fotoğraf\n'

    // Add warning if similar properties exist
    if (similar && similar.length > 0) {
      message += '\n⚠️ Dikkat: ' + similar.length + ' benzer ilan bulundu.\n'
    }

    message += '\n"Evet" diyerek içe aktarın veya "hayır" diyerek iptal edin.'

    const cleanedPropertyData = removeUndefined(propertyData)
    return {
      success: true,
      message,
      needsConfirmation: true,
      confirmationData: {
        action: 'import_property',
        data: cleanedPropertyData,
        scraped,
        similar
      }
    }
  } catch (error) {
    console.error('Import error:', error)
    return {
      success: false,
      message: 'İlan çekilirken hata oluştu',
      error: 'Scraping failed'
    }
  }
}

// Helper functions

function buildPropertyTitle(entities: IntentResult['entities']): string {
  const parts: string[] = []

  if (entities?.rooms) parts.push(entities.rooms)
  if (entities?.propertyType) parts.push(entities.propertyType)
  if (entities?.location?.district) parts.push(entities.location.district)
  if (entities?.location?.city) parts.push(entities.location.city)

  return parts.join(' ') || 'Yeni Mülk'
}

function buildPropertyConfirmation(data: PropertyFormData): string {
  return `Şu mülkü ekleyeyim mi?

📍 ${data.title}
💰 ${formatPrice(data.price)}
📏 ${data.area > 0 ? data.area + ' m²' : 'Belirtilmedi'}
${data.rooms ? '🏠 ' + data.rooms : ''}

"Evet" diyerek onaylayın veya "hayır" diyerek iptal edin.`
}

function buildCustomerConfirmation(data: CustomerFormData): string {
  const budgetStr = data.preferences.budget.max > 0
    ? `${formatPrice(data.preferences.budget.min)} - ${formatPrice(data.preferences.budget.max)}`
    : 'Belirtilmedi'

  return `Şu müşteriyi ekleyeyim mi?

👤 ${data.name}
${data.phone ? '📞 ' + data.phone : ''}
💰 Bütçe: ${budgetStr}

"Evet" diyerek onaylayın veya "hayır" diyerek iptal edin.`
}

function buildPropertySelectionMessage(properties: Property[]): string {
  let message = 'Birden fazla mülk buldum:\n\n'

  properties.slice(0, 5).forEach((p, idx) => {
    message += `${idx + 1}. ${p.title} - ${formatPrice(p.price)}\n`
  })

  message += '\nHangisini seçiyorsunuz? (1, 2, 3...)'
  return message
}

function findPropertyByReference(reference: string, properties: Property[]): Property[] {
  const ref = reference.toLowerCase()
  // Split reference into words for more flexible matching
  const refWords = ref.split(/\s+/).filter(w => w.length > 2)

  return properties.filter(p => {
    const searchableText = [
      p.title,
      p.location.city,
      p.location.district,
      p.location.neighborhood || '',
      p.type,
      p.rooms || ''
    ].join(' ').toLowerCase()

    // Match if reference is contained in searchable text
    if (searchableText.includes(ref)) return true

    // Match if all significant words from reference are found
    if (refWords.length > 0 && refWords.every(word => searchableText.includes(word))) {
      return true
    }

    return false
  })
}

function mapPropertyType(type: string): any {
  const typeMap: Record<string, string> = {
    'daire': 'daire',
    'villa': 'villa',
    'arsa': 'arsa',
    'işyeri': 'işyeri',
    'müstakil': 'müstakil',
    'residence': 'rezidans',
    'rezidans': 'rezidans'
  }

  return typeMap[type.toLowerCase()] || 'daire'
}

function mapStatus(status: string): any {
  const statusMap: Record<string, string> = {
    'active': 'aktif',
    'aktif': 'aktif',
    'pending': 'opsiyonlu',
    'opsiyonlu': 'opsiyonlu',
    'sold': 'satıldı',
    'satıldı': 'satıldı',
    'satildi': 'satıldı',
    'rented': 'kiralandı',
    'kiralandi': 'kiralandı',
    'kiralandı': 'kiralandı'
  }

  return statusMap[status.toLowerCase()] || 'aktif'
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M TL`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K TL`
  }
  return `${price.toLocaleString('tr-TR')} TL`
}

/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 */
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = removeUndefined(value)
    } else {
      result[key] = value
    }
  }
  return result as T
}
