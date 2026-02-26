import { PropertyStatus } from '@/types/property'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock, Home } from 'lucide-react'

interface StatusBadgeProps {
  status: PropertyStatus
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<PropertyStatus, {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  aktif: {
    label: 'Aktif',
    className: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30',
    icon: CheckCircle2,
  },
  satıldı: {
    label: 'Satıldı',
    className: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30',
    icon: XCircle,
  },
  kiralandı: {
    label: 'Kiralandı',
    className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30',
    icon: Home,
  },
  opsiyonlu: {
    label: 'Opsiyonlu',
    className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30',
    icon: Clock,
  },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

export default function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold transition-transform hover:scale-105',
        sizeClasses[size],
        config.className,
        className
      )}
    >
      <Icon className={cn(
        size === 'sm' && 'h-3 w-3',
        size === 'md' && 'h-3.5 w-3.5',
        size === 'lg' && 'h-4 w-4',
      )} />
      {config.label}
    </span>
  )
}
