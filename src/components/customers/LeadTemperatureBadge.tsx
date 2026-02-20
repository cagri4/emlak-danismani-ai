import { Flame, Sun, Snowflake } from 'lucide-react'

interface LeadTemperatureBadgeProps {
  temperature: 'hot' | 'warm' | 'cold'
  showLabel?: boolean
}

const temperatureConfig = {
  hot: {
    label: 'Sıcak',
    icon: Flame,
    styles: 'bg-red-100 text-red-800 border-red-200',
    dotStyles: 'bg-red-500',
  },
  warm: {
    label: 'Ilık',
    icon: Sun,
    styles: 'bg-amber-100 text-amber-800 border-amber-200',
    dotStyles: 'bg-amber-500',
  },
  cold: {
    label: 'Soğuk',
    icon: Snowflake,
    styles: 'bg-blue-100 text-blue-800 border-blue-200',
    dotStyles: 'bg-blue-500',
  },
}

export default function LeadTemperatureBadge({
  temperature,
  showLabel = true,
}: LeadTemperatureBadgeProps) {
  const config = temperatureConfig[temperature]
  const Icon = config.icon

  if (!showLabel) {
    // Compact mode: just colored dot
    return (
      <div
        className={`w-2 h-2 rounded-full ${config.dotStyles}`}
        title={config.label}
      />
    )
  }

  // Full mode: badge with text and icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.styles}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
