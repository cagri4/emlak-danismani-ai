import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '@/hooks/useCustomers'
import { CustomerForm } from '@/components/customer/CustomerForm'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'
import { CustomerFormData } from '@/types/customer'

export default function CustomerAdd() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addCustomer } = useCustomers()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CustomerFormData) => {
    setIsLoading(true)
    const result = await addCustomer(data)
    setIsLoading(false)

    if (result.success) {
      toast({
        title: 'Başarılı',
        description: 'Müşteri başarıyla eklendi',
      })
      navigate('/customers')
      return { success: true }
    } else {
      toast({
        title: 'Hata',
        description: result.error || 'Müşteri eklenirken hata oluştu',
        variant: 'destructive',
      })
      return { success: false, error: result.error }
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/customers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yeni Müşteri Ekle</h1>
            <p className="text-muted-foreground mt-1">
              Müşteri bilgilerini girin
            </p>
          </div>
        </div>

        <CustomerForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
