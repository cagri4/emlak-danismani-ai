import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { KvkkConsent } from '@/types/user'

export function useKVKKConsent() {
  const { user, userProfile, loading } = useAuth()

  // User needs consent if:
  // 1. User is logged in AND
  // 2. Either userProfile doesn't exist yet OR userProfile exists without kvkkConsent
  const needsConsent = !!(user && !loading && (!userProfile || !userProfile.kvkkConsent))

  const saveConsent = async () => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
    }

    try {
      const userDocRef = doc(db, 'users', user.uid)
      const consentData: KvkkConsent = {
        acceptedAt: new Date().toISOString(),
        version: '1.0',
      }

      // Create or update user document with consent
      // For Google OAuth users, also create basic profile from auth data
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          kvkkConsent: {
            ...consentData,
            acceptedAt: serverTimestamp(),
          },
        },
        { merge: true }
      )

      // No need to reload - AuthContext uses real-time listener and will auto-update
      return { success: true }
    } catch (error: any) {
      console.error('KVKK save error:', error)
      return { success: false, error: error?.message || 'KVKK onayı kaydedilemedi' }
    }
  }

  return {
    needsConsent,
    saveConsent,
    consentData: userProfile?.kvkkConsent || null,
  }
}
