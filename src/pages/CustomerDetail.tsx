import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomers } from '@/hooks/useCustomers'
import { useLeadScore } from '@/hooks/useLeadScore'
import { Customer, Interaction } from '@/types/customer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Home,
  Maximize,
  BedDouble,
  MessageSquare,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const urgencyLabels = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
}

const urgencyColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

const interactionTypeLabels = {
  chat_message: 'Sohbet Mesajı',
  phone_call: 'Telefon Görüşmesi',
  property_shown: 'Mülk Gösterimi',
  note: 'Not',
  match_result: 'Eşleşme Sonucu',
}

export default function CustomerDetail() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { id } = useParams<{ id: string }>()
  const { getCustomer, deleteCustomer, addInteraction, getInteractions } = useCustomers({ useRealtime: false })
  const { recalculate: recalculateLeadScore } = useLeadScore(id)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) {
        setError('Müşteri ID bulunamadı')
        setIsLoading(false)
        return
      }

      // Fetch customer
      const result = await getCustomer(id)

      if (result.success && result.customer) {
        setCustomer(result.customer)

        // Fetch interactions
        const interactionsResult = await getInteractions(id, 50)
        if (interactionsResult.success && interactionsResult.interactions) {
          setInteractions(interactionsResult.interactions)
        }
      } else {
        setError(result.error || 'Müşteri yüklenemedi')
      }

      setIsLoading(false)
    }

    fetchCustomerData()
  }, [id])

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)

    const result = await deleteCustomer(id)

    if (result.success) {
      toast({
        title: 'Başarılı',
        description: 'Müşteri silindi',
      })
      navigate('/customers')
    } else {
      toast({
        title: 'Hata',
        description: result.error || 'Müşteri silinemedi',
        variant: 'destructive',
      })
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleAddNote = async () => {
    if (!id || !noteContent.trim()) return

    setIsAddingNote(true)

    const result = await addInteraction(id, {
      type: 'note',
      content: noteContent,
    })

    if (result.success) {
      toast({
        title: 'Başarılı',
        description: 'Not eklendi',
      })
      setNoteContent('')
      setShowNoteForm(false)

      // Refresh interactions
      const interactionsResult = await getInteractions(id, 50)
      if (interactionsResult.success && interactionsResult.interactions) {
        setInteractions(interactionsResult.interactions)
      }

      // Refresh customer to update interaction count
      const customerResult = await getCustomer(id)
      if (customerResult.success && customerResult.customer) {
        setCustomer(customerResult.customer)
      }

      // Recalculate lead score after new interaction
      try {
        await recalculateLeadScore()
      } catch (err) {
        console.error('Failed to recalculate lead score:', err)
        // Don't show error to user - this is background operation
      }
    } else {
      toast({
        title: 'Hata',
        description: result.error || 'Not eklenemedi',
        variant: 'destructive',
      })
    }

    setIsAddingNote(false)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Müşteri yükleniyor...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !customer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">{error || 'Müşteri bulunamadı'}</p>
            <Button className="mt-4" onClick={() => navigate('/customers')}>
              Müşterilere Dön
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/customers')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${urgencyColors[customer.preferences.urgency]}`}>
                  Aciliyet: {urgencyLabels[customer.preferences.urgency]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {customer.interactionCount} etkileşim
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/customers/${id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Müşteriyi silmek istediğinizden emin misiniz?</h3>
                  <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    İptal
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Siliniyor...' : 'Sil'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              İletişim Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {!customer.phone && !customer.email && (
              <p className="text-sm text-muted-foreground">İletişim bilgisi eklenmemiş</p>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Müşteri Tercihleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Budget */}
            <div className="flex items-start gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Bütçe</p>
                <p className="text-sm text-muted-foreground">
                  {customer.preferences.budget.min.toLocaleString('tr-TR')} - {customer.preferences.budget.max.toLocaleString('tr-TR')} ₺
                </p>
              </div>
            </div>

            {/* Location */}
            {customer.preferences.location.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">İlgilendiği Konumlar</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.preferences.location.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Property Types */}
            {customer.preferences.propertyType.length > 0 && (
              <div className="flex items-start gap-2">
                <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Mülk Tipi</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customer.preferences.propertyType.map((type) => (
                      <span key={type} className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rooms */}
            {customer.preferences.rooms && customer.preferences.rooms.length > 0 && (
              <div className="flex items-start gap-2">
                <BedDouble className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Oda Sayısı</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.preferences.rooms.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Area Range */}
            {(customer.preferences.minArea || customer.preferences.maxArea) && (
              <div className="flex items-start gap-2">
                <Maximize className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Alan Aralığı</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.preferences.minArea || 0} - {customer.preferences.maxArea || '∞'} m²
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {customer.preferences.notes && (
              <div className="pt-3 border-t">
                <p className="font-medium mb-1">Tercih Notları</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customer.preferences.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactions Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Etkileşim Geçmişi
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Not Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Note Form */}
            {showNoteForm && (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Not içeriği..."
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNoteForm(false)
                      setNoteContent('')
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={isAddingNote || !noteContent.trim()}
                  >
                    {isAddingNote ? 'Ekleniyor...' : 'Kaydet'}
                  </Button>
                </div>
              </div>
            )}

            {/* Interactions List */}
            {interactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Henüz etkileşim kaydı bulunmuyor
              </p>
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-primary">
                        {interactionTypeLabels[interaction.type]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          interaction.timestamp instanceof Date
                            ? interaction.timestamp
                            : interaction.timestamp.toDate(),
                          'd MMMM yyyy HH:mm',
                          { locale: tr }
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {interaction.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
