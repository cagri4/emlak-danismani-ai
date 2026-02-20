import { useNavigate } from 'react-router-dom'
import { useCustomers } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CustomerCard from '@/components/customer/CustomerCard'
import { Plus, Users } from 'lucide-react'

export default function Customers() {
  const navigate = useNavigate()
  const { customers, loading, error } = useCustomers()

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
