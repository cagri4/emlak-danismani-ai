import { useState, useEffect } from 'react'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Property, PropertyFormData, PropertyStatus, PropertyType, ListingType } from '@/types/property'

interface PropertyFilters {
  status?: PropertyStatus
  type?: PropertyType
  listingType?: ListingType
}

interface UsePropertiesOptions {
  useRealtime?: boolean
  filters?: PropertyFilters
}

export function useProperties(options: UsePropertiesOptions = {}) {
  const { user } = useAuth()
  const { useRealtime = true, filters = {} } = options
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setProperties([])
      setLoading(false)
      return
    }

    const propertiesRef = collection(db, 'users', user.uid, 'properties')
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

    // Apply filters
    if (filters.status) {
      constraints.push(where('status', '==', filters.status))
    }
    if (filters.type) {
      constraints.push(where('type', '==', filters.type))
    }
    if (filters.listingType) {
      constraints.push(where('listingType', '==', filters.listingType))
    }

    const q = query(propertiesRef, ...constraints)

    if (useRealtime) {
      // Real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const propertiesData: Property[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Property[]
          setProperties(propertiesData)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error('Error fetching properties:', err)
          setError('Mülkler yüklenirken hata oluştu')
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } else {
      // One-time fetch
      const fetchProperties = async () => {
        try {
          const snapshot = await getDocs(q)
          const propertiesData: Property[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Property[]
          setProperties(propertiesData)
          setError(null)
        } catch (err) {
          console.error('Error fetching properties:', err)
          setError('Mülkler yüklenirken hata oluştu')
        } finally {
          setLoading(false)
        }
      }

      fetchProperties()
    }
  }, [user, useRealtime, filters.status, filters.type, filters.listingType])

  const addProperty = async (data: PropertyFormData) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const propertiesRef = collection(db, 'users', user.uid, 'properties')
      const docRef = await addDoc(propertiesRef, {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return { success: true, id: docRef.id }
    } catch (err: any) {
      console.error('Error adding property:', err)
      return { success: false, error: err?.message || 'Mülk eklenirken hata oluştu' }
    }
  }

  const updateProperty = async (propertyId: string, data: Partial<PropertyFormData>) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const propertyRef = doc(db, 'users', user.uid, 'properties', propertyId)
      await updateDoc(propertyRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })

      return { success: true }
    } catch (err: any) {
      console.error('Error updating property:', err)
      return { success: false, error: err?.message || 'Mülk güncellenirken hata oluştu' }
    }
  }

  const deleteProperty = async (propertyId: string) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const propertyRef = doc(db, 'users', user.uid, 'properties', propertyId)
      await deleteDoc(propertyRef)

      return { success: true }
    } catch (err: any) {
      console.error('Error deleting property:', err)
      return { success: false, error: err?.message || 'Mülk silinirken hata oluştu' }
    }
  }

  const updateStatus = async (propertyId: string, status: PropertyStatus) => {
    return updateProperty(propertyId, { status })
  }

  const getProperty = async (propertyId: string): Promise<{ success: boolean; property?: Property; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const propertyRef = doc(db, 'users', user.uid, 'properties', propertyId)
      const docSnap = await getDoc(propertyRef)

      if (!docSnap.exists()) {
        return { success: false, error: 'Mülk bulunamadı' }
      }

      const property: Property = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Property

      return { success: true, property }
    } catch (err: any) {
      console.error('Error fetching property:', err)
      return { success: false, error: err?.message || 'Mülk yüklenirken hata oluştu' }
    }
  }

  const refetch = async () => {
    if (!user) return

    setLoading(true)
    const propertiesRef = collection(db, 'users', user.uid, 'properties')
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

    if (filters.status) {
      constraints.push(where('status', '==', filters.status))
    }
    if (filters.type) {
      constraints.push(where('type', '==', filters.type))
    }
    if (filters.listingType) {
      constraints.push(where('listingType', '==', filters.listingType))
    }

    const q = query(propertiesRef, ...constraints)

    try {
      const snapshot = await getDocs(q)
      const propertiesData: Property[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Property[]
      setProperties(propertiesData)
      setError(null)
    } catch (err) {
      console.error('Error refetching properties:', err)
      setError('Mülkler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return {
    properties,
    loading,
    error,
    addProperty,
    updateProperty,
    deleteProperty,
    updateStatus,
    getProperty,
    refetch,
  }
}
