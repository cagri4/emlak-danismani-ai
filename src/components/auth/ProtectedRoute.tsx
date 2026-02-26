import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()

  // Show loading spinner while:
  // 1. Still loading auth state, OR
  // 2. User exists but profile not loaded yet (waiting for Firestore)
  if (loading || (user && !userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Redirect to KVKK only if profile loaded but doesn't have consent
  if (userProfile && !userProfile.kvkkConsent) {
    return <Navigate to="/kvkk" replace />
  }

  return <>{children}</>
}
