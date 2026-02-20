import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthActions } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import NotificationDropdown from '@/components/notifications/NotificationDropdown'
import { useNotifications } from '@/hooks/useNotifications'

export default function Header() {
  const { user, userProfile } = useAuth()
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-primary">
              Emlak Danışmanı AI
            </Link>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <NotificationBell onClick={() => setNotificationsOpen(!notificationsOpen)} />

              {notificationsOpen && (
                <NotificationDropdown
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDelete={deleteNotification}
                  onClose={() => setNotificationsOpen(false)}
                />
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {userProfile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium">{userProfile?.name || user?.email}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-20">
                    <div className="py-1">
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Ayarlar
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-4 py-3 space-y-2">
            <div className="px-3 py-2 text-sm font-medium text-gray-700">
              {userProfile?.name || user?.email}
            </div>
            <Link
              to="/settings"
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ayarlar
            </Link>
            <button
              onClick={() => {
                handleSignOut()
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
