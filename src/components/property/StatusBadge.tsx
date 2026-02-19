import { PropertyStatus } from '@/types/property'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: PropertyStatus
  className?: string
}

const statusConfig: Record<PropertyStatus, { label: string; className: string }> = {
  aktif: {
    label: 'Aktif',
    className: 'bg-green-500 text-white',
  },
  satıldı: {
    label: 'Satıldı',
    className: 'bg-red-500 text-white',
  },
  kiralandı: {
    label: 'Kiralık',
    className: 'bg-blue-500 text-white',
  },
  opsiyonlu: {
    label: 'Opsiyonlu',
    className: 'bg-yellow-500 text-white',
  },
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'px-2 py-1 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
