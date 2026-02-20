import { PropertyMatch } from '@/types/matching'
import { Button } from '@/components/ui/button'

interface MatchResultsProps {
  matches: PropertyMatch[]
  customerName: string
  onView: (propertyId: string) => void
  onShare: (propertyId: string) => void
  onFeedback: (propertyId: string, liked: boolean) => void
}

export function MatchResults({
  matches,
  customerName,
  onView,
  onShare,
  onFeedback
}: MatchResultsProps) {
  if (matches.length === 0) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          {customerName} için uygun mülk bulunamadı.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {customerName} için {matches.length} mülk buldum:
      </p>
      {matches.map((match, index) => (
        <div
          key={match.property.id}
          className="p-3 bg-white border rounded-lg shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">
                {index + 1}. {match.property.title}
              </span>
              <span className="ml-2 text-sm font-bold text-blue-600">
                ({match.score.score}%)
              </span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => onView(match.property.id)}>
                Görüntüle
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onShare(match.property.id)}>
                Paylaş
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {match.explanation}
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFeedback(match.property.id, true)}
            >
              👍 Beğendi
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFeedback(match.property.id, false)}
            >
              👎 Beğenmedi
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
