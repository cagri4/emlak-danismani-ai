import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { KvkkConsent } from '@/types/user'

export function useKVKKConsent() {
  const { user, userProfile } = useAuth()

  const needsConsent = !!(user && userProfile && !userProfile.kvkkConsent)

  const saveConsent = async () => {
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı')
    }

    try {
      const userDoc = doc(db, 'users', user.uid)
      const consentData: KvkkConsent = {
        acceptedAt: new Date().toISOString(),
        version: '1.0',
      }

      await setDoc(
        userDoc,
        {
          kvkkConsent: {
            ...consentData,
            acceptedAt: serverTimestamp(),
          },
        },
        { merge: true }
      )

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || 'KVKK onayı kaydedilemedi' }
    }
  }

  return {
    needsConsent,
    saveConsent,
    consentData: userProfile?.kvkkConsent || null,
  }
}
