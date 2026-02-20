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
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  serverTimestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Customer, CustomerFormData, Interaction } from '@/types/customer'

interface UseCustomersOptions {
  useRealtime?: boolean
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { user } = useAuth()
  const {
    useRealtime = true,
    limit,
    orderBy = 'createdAt',
    orderDirection = 'desc'
  } = options
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setCustomers([])
      setLoading(false)
      return
    }

    const customersRef = collection(db, 'users', user.uid, 'customers')
    const constraints: QueryConstraint[] = [firestoreOrderBy(orderBy, orderDirection)]

    // Apply limit if specified
    if (limit) {
      constraints.push(firestoreLimit(limit))
    }

    const q = query(customersRef, ...constraints)

    if (useRealtime) {
      // Real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const customersData: Customer[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            lastInteraction: doc.data().lastInteraction?.toDate(),
          })) as Customer[]

          setCustomers(customersData)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error('Error fetching customers:', err)
          setError('Müşteriler yüklenirken hata oluştu')
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } else {
      // One-time fetch
      const fetchCustomers = async () => {
        try {
          const snapshot = await getDocs(q)
          const customersData: Customer[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            lastInteraction: doc.data().lastInteraction?.toDate(),
          })) as Customer[]

          setCustomers(customersData)
          setError(null)
        } catch (err) {
          console.error('Error fetching customers:', err)
          setError('Müşteriler yüklenirken hata oluştu')
        } finally {
          setLoading(false)
        }
      }

      fetchCustomers()
    }
  }, [user, useRealtime, limit, orderBy, orderDirection])

  const addCustomer = async (data: CustomerFormData) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const customersRef = collection(db, 'users', user.uid, 'customers')
      const docRef = await addDoc(customersRef, {
        ...data,
        userId: user.uid,
        interactionCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return { success: true, id: docRef.id }
    } catch (err: any) {
      console.error('Error adding customer:', err)
      return { success: false, error: err?.message || 'Müşteri eklenirken hata oluştu' }
    }
  }

  const updateCustomer = async (customerId: string, data: Partial<CustomerFormData>) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const customerRef = doc(db, 'users', user.uid, 'customers', customerId)
      await updateDoc(customerRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })

      return { success: true }
    } catch (err: any) {
      console.error('Error updating customer:', err)
      return { success: false, error: err?.message || 'Müşteri güncellenirken hata oluştu' }
    }
  }

  const deleteCustomer = async (customerId: string) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const customerRef = doc(db, 'users', user.uid, 'customers', customerId)
      await deleteDoc(customerRef)

      return { success: true }
    } catch (err: any) {
      console.error('Error deleting customer:', err)
      return { success: false, error: err?.message || 'Müşteri silinirken hata oluştu' }
    }
  }

  const getCustomer = async (customerId: string): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const customerRef = doc(db, 'users', user.uid, 'customers', customerId)
      const docSnap = await getDoc(customerRef)

      if (!docSnap.exists()) {
        return { success: false, error: 'Müşteri bulunamadı' }
      }

      const customer: Customer = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        lastInteraction: docSnap.data().lastInteraction?.toDate(),
      } as Customer

      return { success: true, customer }
    } catch (err: any) {
      console.error('Error fetching customer:', err)
      return { success: false, error: err?.message || 'Müşteri yüklenirken hata oluştu' }
    }
  }

  const addInteraction = async (
    customerId: string,
    interaction: Omit<Interaction, 'id' | 'timestamp'>
  ) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      // Add interaction to subcollection
      const interactionsRef = collection(db, 'users', user.uid, 'customers', customerId, 'interactions')
      await addDoc(interactionsRef, {
        ...interaction,
        timestamp: serverTimestamp(),
      })

      // Update customer's interaction count and last interaction timestamp
      const customerRef = doc(db, 'users', user.uid, 'customers', customerId)
      const customerSnap = await getDoc(customerRef)

      if (customerSnap.exists()) {
        const currentCount = customerSnap.data().interactionCount || 0
        await updateDoc(customerRef, {
          interactionCount: currentCount + 1,
          lastInteraction: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      return { success: true }
    } catch (err: any) {
      console.error('Error adding interaction:', err)
      return { success: false, error: err?.message || 'Etkileşim eklenirken hata oluştu' }
    }
  }

  const getInteractions = async (
    customerId: string,
    limitCount: number = 50
  ): Promise<{ success: boolean; interactions?: Interaction[]; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const interactionsRef = collection(db, 'users', user.uid, 'customers', customerId, 'interactions')
      const q = query(
        interactionsRef,
        firestoreOrderBy('timestamp', 'desc'),
        firestoreLimit(limitCount)
      )

      const snapshot = await getDocs(q)
      const interactions: Interaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Interaction[]

      return { success: true, interactions }
    } catch (err: any) {
      console.error('Error fetching interactions:', err)
      return { success: false, error: err?.message || 'Etkileşimler yüklenirken hata oluştu' }
    }
  }

  const refetch = async () => {
    if (!user) return

    setLoading(true)
    const customersRef = collection(db, 'users', user.uid, 'customers')
    const constraints: QueryConstraint[] = [firestoreOrderBy(orderBy, orderDirection)]

    if (limit) {
      constraints.push(firestoreLimit(limit))
    }

    const q = query(customersRef, ...constraints)

    try {
      const snapshot = await getDocs(q)
      const customersData: Customer[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastInteraction: doc.data().lastInteraction?.toDate(),
      })) as Customer[]

      setCustomers(customersData)
      setError(null)
    } catch (err) {
      console.error('Error refetching customers:', err)
      setError('Müşteriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    addInteraction,
    getInteractions,
    refetch,
  }
}
