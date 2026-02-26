import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthActions } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, Loader2, LogOut, Settings, User } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import NotificationDropdown from '@/components/notifications/NotificationDropdown'
import { useNotifications } from '@/hooks/useNotifications'
import { useUploadStore } from '@/stores/uploadStore'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, userProfile } = useAuth()
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const { hasActiveUploads, uploads } = useUploadStore()

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
    <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Menu Button + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Emlak Danışmanı AI
            </Link>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* Upload Indicator */}
            {hasActiveUploads() && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">
                  {uploads.filter((u) => u.status === 'uploading' || u.status === 'pending').length} fotoğraf yükleniyor
                </span>
              </div>
            )}

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
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-200"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold shadow-lg shadow-indigo-500/20">
                  {userProfile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold text-slate-900">{userProfile?.name || 'Kullanıcı'}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-soft-lg border border-slate-100 z-20 overflow-hidden animate-fade-in">
                    <div className="p-2">
                      <div className="px-3 py-2 mb-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">{userProfile?.name || 'Kullanıcı'}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        Ayarlar
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
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
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-slate-600" />
              ) : (
                <User className="h-5 w-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-slide-down">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-xl mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                {userProfile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{userProfile?.name || 'Kullanıcı'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Ayarlar
            </Link>
            <button
              onClick={() => {
                handleSignOut()
                setMobileMenuOpen(false)
              }}
              className="flex items-center gap-3 w-full text-left px-3 py-3 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
