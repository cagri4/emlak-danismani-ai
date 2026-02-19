import { useState, useEffect } from 'react'
import { collection, query, where, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardMetrics {
  total: number
  aktif: number
  satildi: number
  kiralik: number
  opsiyonlu: number
  loading: boolean
}

export function useDashboardMetrics(): DashboardMetrics {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total: 0,
    aktif: 0,
    satildi: 0,
    kiralik: 0,
    opsiyonlu: 0,
    loading: true,
  })

  useEffect(() => {
    if (!user) {
      setMetrics({
        total: 0,
        aktif: 0,
        satildi: 0,
        kiralik: 0,
        opsiyonlu: 0,
        loading: false,
      })
      return
    }

    const fetchMetrics = async () => {
      try {
        const propertiesRef = collection(db, 'users', user.uid, 'properties')

        // Get total count
        const totalSnapshot = await getCountFromServer(propertiesRef)
        const total = totalSnapshot.data().count

        // Get count by status
        const aktifQuery = query(propertiesRef, where('status', '==', 'aktif'))
        const aktifSnapshot = await getCountFromServer(aktifQuery)
        const aktif = aktifSnapshot.data().count

        const satildiQuery = query(propertiesRef, where('status', '==', 'satıldı'))
        const satildiSnapshot = await getCountFromServer(satildiQuery)
        const satildi = satildiSnapshot.data().count

        const kiralikQuery = query(propertiesRef, where('status', '==', 'kiralandı'))
        const kiralikSnapshot = await getCountFromServer(kiralikQuery)
        const kiralik = kiralikSnapshot.data().count

        const opsiyonluQuery = query(propertiesRef, where('status', '==', 'opsiyonlu'))
        const opsiyonluSnapshot = await getCountFromServer(opsiyonluQuery)
        const opsiyonlu = opsiyonluSnapshot.data().count

        setMetrics({
          total,
          aktif,
          satildi,
          kiralik,
          opsiyonlu,
          loading: false,
        })
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error)
        setMetrics({
          total: 0,
          aktif: 0,
          satildi: 0,
          kiralik: 0,
          opsiyonlu: 0,
          loading: false,
        })
      }
    }

    fetchMetrics()
  }, [user])

  return metrics
}
