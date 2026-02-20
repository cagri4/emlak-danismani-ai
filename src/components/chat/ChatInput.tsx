import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatContext } from './ChatProvider';

interface ChatInputProps {
  suggestionText?: string | null;
  onSuggestionUsed?: () => void;
}

export function ChatInput({ suggestionText, onSuggestionUsed }: ChatInputProps) {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle suggestion text from chips
  useEffect(() => {
    if (suggestionText) {
      setInput(suggestionText);
      textareaRef.current?.focus();
      onSuggestionUsed?.();
    }
  }, [suggestionText, onSuggestionUsed]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px'; // Max 4 lines (24px * 4)
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();
    setInput('');
    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-end gap-2">
        {/* Attachment button (placeholder) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          disabled
          aria-label="Dosya ekle"
        >
          <Paperclip className="h-5 w-5 text-gray-400" />
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesaj yazın..."
            disabled={isLoading}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '96px' }}
          />
        </div>

        {/* Voice button (placeholder) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          disabled
          aria-label="Sesli mesaj"
        >
          <Mic className="h-5 w-5 text-gray-400" />
        </Button>

        {/* Send button */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
          aria-label="Gönder"
        >
          <Send className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
}
