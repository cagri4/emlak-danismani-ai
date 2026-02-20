import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Phone, Calendar } from 'lucide-react'
import { Customer } from '@/types/customer'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import LeadTemperatureBadge from '@/components/customers/LeadTemperatureBadge'

interface HotLeadsCardProps {
  customers: Array<{ customer: Customer; score: number; temperature: 'hot' | 'warm' | 'cold' }>
}

export default function HotLeadsCard({ customers }: HotLeadsCardProps) {
  // Filter to hot leads and sort by score
  const hotLeads = customers
    .filter(item => item.temperature === 'hot')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Top 5

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-50">
            <Flame className="h-5 w-5 text-red-600" />
          </div>
          Sıcak Adaylar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hotLeads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Henüz sıcak aday bulunmuyor
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tüm müşterilerle iletişimde kalın!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {hotLeads.map(({ customer, score, temperature }) => {
              const lastContactDate = customer.lastInteraction
                ? customer.lastInteraction instanceof Date
                  ? customer.lastInteraction
                  : customer.lastInteraction.toDate()
                : null

              return (
                <Link
                  key={customer.id}
                  to={`/customers/${customer.id}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {customer.name}
                        </h4>
                        <LeadTemperatureBadge temperature={temperature} showLabel={false} />
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {lastContactDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(lastContactDate, 'd MMM yyyy', { locale: tr })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        {score}
                      </div>
                      <div className="text-xs text-gray-500">puan</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
