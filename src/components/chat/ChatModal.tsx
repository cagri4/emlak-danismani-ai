import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatContext } from './ChatProvider';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { SuggestionChips } from './SuggestionChips';
import { useState } from 'react';

export function ChatModal() {
  const { isOpen, closeChat } = useChatContext();
  const [suggestionText, setSuggestionText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSuggestionClick = (text: string) => {
    setSuggestionText(text);
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">AI Asistan</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeChat}
          className="h-8 w-8"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ChatMessages />

      {/* Suggestion Chips */}
      <SuggestionChips onSuggestionClick={handleSuggestionClick} />

      {/* Input */}
      <ChatInput suggestionText={suggestionText} onSuggestionUsed={() => setSuggestionText(null)} />
    </div>
  );
}
