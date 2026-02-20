import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import type { MonitoringCriteria } from '@/types/notification'
import { Plus, Trash2, ToggleLeft, ToggleRight, Clock, Users } from 'lucide-react'

/**
 * Settings page for competitor monitoring configuration
 * Users can add/edit/delete monitoring criteria
 */
export default function MonitoringSettingsPage() {
  const { user } = useAuth()
  const [criteria, setCriteria] = useState<MonitoringCriteria[]>([])
  const [customerCount, setCustomerCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    region: '',
    priceMin: '',
    priceMax: '',
    propertyType: 'daire',
    portals: {
      sahibinden: true,
      hepsiemlak: true,
      emlakjet: true
    }
  })

  useEffect(() => {
    if (user?.uid) {
      loadCriteria()
      loadCustomerCount()
    }
  }, [user?.uid])

  const loadCriteria = async () => {
    if (!user?.uid) return

    try {
      const criteriaRef = collection(db, 'users', user.uid, 'monitoring_criteria')
      const snapshot = await getDocs(criteriaRef)

      const loadedCriteria: MonitoringCriteria[] = []
      snapshot.forEach((doc) => {
        loadedCriteria.push({
          id: doc.id,
          ...doc.data()
        } as MonitoringCriteria)
      })

      setCriteria(loadedCriteria)
    } catch (error) {
      console.error('Error loading criteria:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCustomerCount = async () => {
    if (!user?.uid) return

    try {
      const customersRef = collection(db, 'users', user.uid, 'customers')
      const snapshot = await getDocs(customersRef)
      setCustomerCount(snapshot.size)
    } catch (error) {
      console.error('Error loading customer count:', error)
    }
  }

  const handleAddCriteria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    try {
      const selectedPortals = Object.entries(formData.portals)
        .filter(([_, enabled]) => enabled)
        .map(([portal, _]) => portal) as ('sahibinden' | 'hepsiemlak' | 'emlakjet')[]

      const newCriteria = {
        region: formData.region,
        priceMin: formData.priceMin ? parseInt(formData.priceMin) : undefined,
        priceMax: formData.priceMax ? parseInt(formData.priceMax) : undefined,
        propertyType: formData.propertyType,
        portals: selectedPortals,
        enabled: true
      }

      const criteriaRef = collection(db, 'users', user.uid, 'monitoring_criteria')
      await addDoc(criteriaRef, newCriteria)

      // Reset form
      setFormData({
        region: '',
        priceMin: '',
        priceMax: '',
        propertyType: 'daire',
        portals: {
          sahibinden: true,
          hepsiemlak: true,
          emlakjet: true
        }
      })
      setShowAddForm(false)

      // Reload criteria
      loadCriteria()
    } catch (error) {
      console.error('Error adding criteria:', error)
      alert('Kriter eklenirken hata oluştu')
    }
  }

  const handleToggleCriteria = async (criteriaId: string, currentEnabled: boolean) => {
    if (!user?.uid) return

    try {
      const criteriaRef = doc(db, 'users', user.uid, 'monitoring_criteria', criteriaId)
      await updateDoc(criteriaRef, { enabled: !currentEnabled })
      loadCriteria()
    } catch (error) {
      console.error('Error toggling criteria:', error)
    }
  }

  const handleDeleteCriteria = async (criteriaId: string) => {
    if (!user?.uid) return
    if (!confirm('Bu kriteri silmek istediğinize emin misiniz?')) return

    try {
      const criteriaRef = doc(db, 'users', user.uid, 'monitoring_criteria', criteriaId)
      await deleteDoc(criteriaRef)
      loadCriteria()
    } catch (error) {
      console.error('Error deleting criteria:', error)
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return ''
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M TL`
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K TL`
    }
    return `${price.toLocaleString('tr-TR')} TL`
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rakip İlanları İzleme</h1>
        <p className="text-gray-600">
          Belirli bölge ve fiyat aralıklarındaki yeni ilanları otomatik olarak takip edin.
        </p>
      </div>

      {/* Schedule Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Otomatik Kontrol</h3>
            <p className="text-sm text-blue-800">
              Sistem günde 2 kez (09:00 ve 21:00) rakip portalları kontrol eder ve yeni ilanlar için bildirim gönderir.
            </p>
          </div>
        </div>
      </div>

      {/* Customer-based monitoring info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-green-900 mb-1">Müşteri Tercihleri</h3>
            <p className="text-sm text-green-800 mb-2">
              Müşterilerinizin tercihleri otomatik olarak izlenir. {customerCount} aktif müşteri için izleme yapılıyor.
            </p>
            <a
              href="/customers"
              className="text-sm text-green-700 hover:text-green-800 underline"
            >
              Müşteri listesine git
            </a>
          </div>
        </div>
      </div>

      {/* Manual Criteria Section */}
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Manuel İzleme Kriterleri</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Kriter Ekle
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddCriteria} className="px-4 py-4 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bölge (Şehir)
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Örn: İstanbul, Ankara"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mülk Tipi
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="daire">Daire</option>
                  <option value="villa">Villa</option>
                  <option value="arsa">Arsa</option>
                  <option value="işyeri">İşyeri</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. Fiyat (TL)
                </label>
                <input
                  type="number"
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                  placeholder="Örn: 1000000"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max. Fiyat (TL)
                </label>
                <input
                  type="number"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                  placeholder="Örn: 2000000"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İzlenecek Portallar
              </label>
              <div className="flex gap-4">
                {Object.keys(formData.portals).map((portal) => (
                  <label key={portal} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.portals[portal as keyof typeof formData.portals]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          portals: {
                            ...formData.portals,
                            [portal]: e.target.checked
                          }
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{portal}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        )}

        {/* Criteria List */}
        <div className="divide-y">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">Yükleniyor...</div>
          ) : criteria.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Henüz kriter eklenmedi. "Kriter Ekle" butonuna tıklayarak başlayın.
            </div>
          ) : (
            criteria.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{item.region}</span>
                    <span className="text-sm text-gray-500">• {item.propertyType}</span>
                    {!item.enabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                        Pasif
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.priceMin || item.priceMax ? (
                      <>
                        Fiyat: {formatPrice(item.priceMin) || '0'} - {formatPrice(item.priceMax) || '∞'}
                      </>
                    ) : (
                      'Fiyat sınırı yok'
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {item.portals.map((portal) => (
                      <span
                        key={portal}
                        className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded"
                      >
                        {portal}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCriteria(item.id, item.enabled)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    title={item.enabled ? 'Devre dışı bırak' : 'Etkinleştir'}
                  >
                    {item.enabled ? (
                      <ToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteCriteria(item.id)}
                    className="p-2 hover:bg-red-50 rounded-md"
                    title="Sil"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
