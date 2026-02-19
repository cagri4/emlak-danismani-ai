import { PropertyType } from '@/types/property'

interface PropertyPlaceholderProps {
  type: PropertyType
  className?: string
}

export default function PropertyPlaceholder({ type, className }: PropertyPlaceholderProps) {
  const placeholderPath = `/placeholders/${type}.svg`

  return (
    <div className={className}>
      <img
        src={placeholderPath}
        alt={`${type} placeholder`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to generic building icon if SVG not found
          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Cpath d="M3 21h18M9 8h1m-1 4h1m-1 4h1M12 3L4 9v12h16V9l-8-6z"%3E%3C/path%3E%3C/svg%3E'
        }}
      />
    </div>
  )
}
