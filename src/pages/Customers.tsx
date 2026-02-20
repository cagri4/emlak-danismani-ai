import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '@/hooks/useCustomers'
import { useLeadScores } from '@/hooks/useLeadScore'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CustomerCard from '@/components/customer/CustomerCard'
import { Plus, Users, ArrowUpDown } from 'lucide-react'

export default function Customers() {
  const navigate = useNavigate()
  const { customers, loading, error } = useCustomers()
  const [sortBy, setSortBy] = useState<'name' | 'leadScore' | 'lastInteraction'>('leadScore')
  const [filterTemperature, setFilterTemperature] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')

  // Calculate lead scores for all customers
  const leadScores = useLeadScores(customers)

  // Sort and filter customers
  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers]

    // Filter by temperature
    if (filterTemperature !== 'all') {
      result = result.filter(customer => {
        const scoreData = leadScores.get(customer.id)
        return scoreData?.temperature === filterTemperature
      })
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'leadScore') {
        const scoreA = leadScores.get(a.id)?.score ?? 0
        const scoreB = leadScores.get(b.id)?.score ?? 0
        return scoreB - scoreA // Descending
      } else if (sortBy === 'lastInteraction') {
        const dateA = a.lastInteraction instanceof Date ? a.lastInteraction : a.lastInteraction?.toDate()
        const dateB = b.lastInteraction instanceof Date ? b.lastInteraction : b.lastInteraction?.toDate()
        if (!dateA) return 1
        if (!dateB) return -1
        return dateB.getTime() - dateA.getTime()
      } else {
        // Sort by name
        return a.name.localeCompare(b.name, 'tr')
      }
    })

    return result
  }, [customers, leadScores, sortBy, filterTemperature])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Müşteriler yükleniyor...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Müşteriler</h1>
            <p className="text-muted-foreground mt-1">
              {customers.length > 0
                ? `${customers.length} müşterinizi yönetin`
                : 'Henüz müşteri eklenmemiş'}
            </p>
          </div>
          <Button onClick={() => navigate('/customers/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Müşteri Ekle
          </Button>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Henüz müşteri eklenmemiş</h3>
            <p className="text-muted-foreground mb-6">
              İlk müşterinizi ekleyerek başlayın
            </p>
            <Button onClick={() => navigate('/customers/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Müşteri Ekle
            </Button>
          </div>
        ) : (
          <>
            {/* Sort and Filter Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sıralama:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border rounded px-3 py-1.5 bg-white"
                >
                  <option value="leadScore">Adaylık Puanı</option>
                  <option value="lastInteraction">Son Etkileşim</option>
                  <option value="name">İsim</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filtre:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterTemperature('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                      filterTemperature === 'all'
                        ? 'bg-gray-200 text-gray-900 border-gray-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setFilterTemperature('hot')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                      filterTemperature === 'hot'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50'
                    }`}
                  >
                    Sıcak
                  </button>
                  <button
                    onClick={() => setFilterTemperature('warm')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                      filterTemperature === 'warm'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50'
                    }`}
                  >
                    Ilık
                  </button>
                  <button
                    onClick={() => setFilterTemperature('cold')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                      filterTemperature === 'cold'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50'
                    }`}
                  >
                    Soğuk
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  leadScore={leadScores.get(customer.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
