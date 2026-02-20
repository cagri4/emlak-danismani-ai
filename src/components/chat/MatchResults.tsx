import type { MatchResult } from '@/types/chat'
import { InlinePropertyCard } from './InlinePropertyCard'

interface MatchResultsProps {
  matches: MatchResult[]
}

export function MatchResults({ matches }: MatchResultsProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 my-2">
      {matches.map((match, index) => (
        <div key={match.propertyId} className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600 px-1">
            <span className="font-medium">#{index + 1}</span>
            {match.score > 0 && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {match.score}% uyumlu
              </span>
            )}
          </div>
          {match.explanation && (
            <p className="text-sm text-gray-600 px-1 mb-1">{match.explanation}</p>
          )}
          <InlinePropertyCard propertyId={match.propertyId} />
        </div>
      ))}
    </div>
  )
}
