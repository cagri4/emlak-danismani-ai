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
            if (docSnapshot.exists()) {
              const profileData = docSnapshot.data() as UserProfile
              console.log('🔐 User profile loaded:', {
                hasKvkkConsent: !!profileData.kvkkConsent,
                kvkkConsent: profileData.kvkkConsent
              })
              setUserProfile(profileData)
            } else {
              console.log('🔐 User profile document does not exist')
              setUserProfile(null)
            }
            setLoading(false)
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
