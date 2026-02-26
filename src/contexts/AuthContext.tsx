import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { UserProfile } from '@/types/user'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 AuthProvider: Setting up auth state listener')

    let unsubscribeProfile: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email || 'No user')
      setUser(firebaseUser)

      // Clean up previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile()
        unsubscribeProfile = null
      }

      if (firebaseUser) {
        // Use real-time listener for user profile (fixes KVKK race condition)
        console.log('🔐 Setting up profile listener for:', firebaseUser.uid)
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (docSnapshot) => {
            // Check if data is from server (not cache) to avoid flash
            const fromCache = docSnapshot.metadata.fromCache

            if (docSnapshot.exists()) {
              const profileData = docSnapshot.data() as UserProfile
              console.log('🔐 User profile loaded:', {
                hasKvkkConsent: !!profileData.kvkkConsent,
                fromCache
              })

              // Always update profile with latest data
              setUserProfile(profileData)

              // Only set loading=false when we have server data or cache with consent
              // This prevents brief flash of KVKK page when cache is stale
              if (!fromCache || profileData.kvkkConsent) {
                setLoading(false)
              }
            } else {
              console.log('🔐 User profile document does not exist, fromCache:', fromCache)
              // Only act on server data, not cache "not found"
              if (!fromCache) {
                setUserProfile(null)
                setLoading(false)
              }
            }
          },
          (error) => {
            console.error('🔐 Error fetching user profile:', error)
            setUserProfile(null)
            setLoading(false)
          }
        )
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeProfile) {
        unsubscribeProfile()
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
