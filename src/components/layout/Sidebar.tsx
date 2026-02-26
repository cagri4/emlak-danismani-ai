import { Link, useLocation } from 'react-router-dom'
import { Home, Building2, PlusCircle, Users, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Mülkler', path: '/properties', icon: Building2 },
  { name: 'Yeni Mülk Ekle', path: '/properties/new', icon: PlusCircle },
  { name: 'Müşteriler', path: '/customers', icon: Users },
  { name: 'Ayarlar', path: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50">
      {/* Logo Area */}
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">Emlak AI</h1>
            <p className="text-xs text-slate-400">Danışman Portalı</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1.5">
        <p className="px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menü
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path ||
            (item.path === '/properties' && location.pathname.startsWith('/properties') && location.pathname !== '/properties/new') ||
            (item.path === '/customers' && location.pathname.startsWith('/customers') && location.pathname !== '/customers/new')

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full shadow-lg shadow-indigo-500/50" />
              )}

              <span className={cn(
                'p-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:text-slate-300'
              )}>
                <Icon className="h-4 w-4" />
              </span>

              <span className="flex-1">{item.name}</span>

              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full">
                  {item.badge}
                </span>
              )}

              {/* Hover glow effect */}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 to-purple-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50">
        <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <p className="text-xs font-medium text-indigo-300">AI Asistan Aktif</p>
          <p className="text-xs text-slate-500 mt-0.5">Telegram bot çalışıyor</p>
        </div>
      </div>
    </aside>
  )
}
