import { Link } from 'react-router-dom'
import { User, Phone, Mail, MapPin, DollarSign, Calendar, MessageSquare } from 'lucide-react'
import { Customer } from '@/types/customer'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CustomerCardProps {
  customer: Customer
}

const urgencyColors = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-red-100 text-red-800 border-red-300',
}

const urgencyLabels = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const budgetText = customer.preferences.budget
    ? `${customer.preferences.budget.min.toLocaleString('tr-TR')} - ${customer.preferences.budget.max.toLocaleString('tr-TR')} ₺`
    : 'Belirtilmemiş'

  const locationText = customer.preferences.location.length > 0
    ? customer.preferences.location.slice(0, 2).join(', ') +
      (customer.preferences.location.length > 2 ? ` +${customer.preferences.location.length - 2}` : '')
    : 'Belirtilmemiş'

  return (
    <Link to={`/customers/${customer.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
        <div className="p-5 space-y-4">
          {/* Header with Name and Urgency */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                {customer.interactionCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MessageSquare className="h-3 w-3" />
                    <span>{customer.interactionCount} etkileşim</span>
                  </div>
                )}
              </div>
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full border ${
                urgencyColors[customer.preferences.urgency]
              }`}
            >
              {urgencyLabels[customer.preferences.urgency]}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
          </div>

          {/* Preferences Summary */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <DollarSign className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-500" />
              <div>
                <span className="font-medium text-gray-700">Bütçe:</span>
                <span className="text-gray-600 ml-2">{budgetText}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-500" />
              <div>
                <span className="font-medium text-gray-700">Konum:</span>
                <span className="text-gray-600 ml-2">{locationText}</span>
              </div>
            </div>
            {customer.preferences.propertyType.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {customer.preferences.propertyType.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Last Interaction */}
          {customer.lastInteraction && (
            <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 border-t">
              <Calendar className="h-3 w-3" />
              <span>
                Son etkileşim:{' '}
                {format(
                  customer.lastInteraction instanceof Date
                    ? customer.lastInteraction
                    : customer.lastInteraction.toDate(),
                  'd MMMM yyyy',
                  { locale: tr }
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
