import { useEffect, useState } from 'react';
import { User, Phone, MapPin, DollarSign, Clock } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer';

interface InlineCustomerCardProps {
  customerId: string;
}

export function InlineCustomerCard({ customerId }: InlineCustomerCardProps) {
  const { getCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      const result = await getCustomer(customerId);
      if (result.success && result.customer) {
        setCustomer(result.customer);
      }
      setLoading(false);
    }

    fetchCustomer();
  }, [customerId, getCustomer]);

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-3 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M TL`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K TL`;
    }
    return `${price.toLocaleString('tr-TR')} TL`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return urgency;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 my-2 hover:shadow-md transition-shadow">
      {/* Customer Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-blue-100 rounded-full p-2">
          <User className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {customer.name}
          </h3>
          {customer.phone && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
              <Phone className="h-3.5 w-3.5" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(customer.preferences.urgency)}`}>
          {getUrgencyLabel(customer.preferences.urgency)}
        </span>
      </div>

      {/* Customer Info */}
      <div className="space-y-2 text-sm">
        {customer.preferences.location.length > 0 && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">
              {customer.preferences.location.join(', ')}
            </span>
          </div>
        )}

        {(customer.preferences.budget.min > 0 || customer.preferences.budget.max > 0) && (
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>
              {formatPrice(customer.preferences.budget.min)} - {formatPrice(customer.preferences.budget.max)}
            </span>
          </div>
        )}

        {customer.interactionCount > 0 && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{customer.interactionCount} etkileşim</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-3 border-t border-gray-100 mt-3">
        <button
          onClick={() => window.open(`/customers/${customerId}`, '_blank')}
          className="w-full py-1.5 px-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          Görüntüle
        </button>
      </div>
    </div>
  );
}
