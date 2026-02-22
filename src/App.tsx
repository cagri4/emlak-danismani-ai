import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ChatProvider } from '@/components/chat/ChatProvider'
import { ChatFloatingButton } from '@/components/chat/ChatFloatingButton'
import { ChatModal } from '@/components/chat/ChatModal'
import { ReloadPrompt } from '@/pwa/ReloadPrompt'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { NotificationPermissionPrompt } from '@/components/notifications/NotificationPermissionPrompt'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import VerifyEmail from '@/pages/VerifyEmail'
import KVKKConsent from '@/pages/KVKKConsent'
import Dashboard from '@/pages/Dashboard'
import Settings from '@/pages/Settings'
import Properties from '@/pages/Properties'
import PropertyAdd from '@/pages/PropertyAdd'
import PropertyEdit from '@/pages/PropertyEdit'
import PropertyDetail from '@/pages/PropertyDetail'
import { PropertySharePage } from '@/pages/properties/PropertySharePage'
import Customers from '@/pages/Customers'
import CustomerAdd from '@/pages/CustomerAdd'
import CustomerDetail from '@/pages/CustomerDetail'

function ChatComponents() {
  const { user } = useAuth()

  // Only show chat when user is authenticated
  if (!user) return null

  return (
    <>
      <ChatFloatingButton />
      <ChatModal />
      <NotificationPermissionPrompt />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          {/* Offline notification banner - shows when connection lost */}
          <OfflineBanner />

          {/* PWA install prompt - shows at top of app */}
          <InstallPrompt />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/kvkk" element={<KVKKConsent />} />

            {/* Public share page */}
            <Route path="/share/:userId/:propertyId" element={<PropertySharePage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties"
              element={
                <ProtectedRoute>
                  <Properties />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties/new"
              element={
                <ProtectedRoute>
                  <PropertyAdd />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties/:id"
              element={
                <ProtectedRoute>
                  <PropertyDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties/:id/edit"
              element={
                <ProtectedRoute>
                  <PropertyEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/new"
              element={
                <ProtectedRoute>
                  <CustomerAdd />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <ProtectedRoute>
                  <CustomerDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/:id/edit"
              element={
                <ProtectedRoute>
                  <CustomerAdd />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Chat UI - persists across all routes */}
          <ChatComponents />

          {/* PWA update prompt - persists across all routes */}
          <ReloadPrompt />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
