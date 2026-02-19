import { Link, useLocation } from 'react-router-dom'
import { Home, Building2, PlusCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Mülkler', path: '/properties', icon: Building2 },
  { name: 'Yeni Mülk Ekle', path: '/properties/new', icon: PlusCircle },
  { name: 'Ayarlar', path: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white border-r min-h-screen">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path ||
            (item.path === '/properties' && location.pathname.startsWith('/properties') && location.pathname !== '/properties/new')

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
