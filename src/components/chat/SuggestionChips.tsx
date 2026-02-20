import { Button } from '@/components/ui/button';

interface SuggestionChipsProps {
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS = [
  'Mülk ekle',
  'Müşteri ekle',
  'Mülk ara',
  'Eşleşme bul',
  'İlan yaz',
];

export function SuggestionChips({ onSuggestionClick }: SuggestionChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {SUGGESTIONS.map((suggestion) => (
        <Button
          key={suggestion}
          variant="outline"
          size="sm"
          onClick={() => onSuggestionClick(suggestion)}
          className="rounded-full whitespace-nowrap text-xs"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
