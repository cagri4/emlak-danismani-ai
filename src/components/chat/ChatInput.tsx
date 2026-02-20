import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatContext } from './ChatProvider';
import { VoiceButton } from './VoiceButton';
import { AttachmentButton } from './AttachmentButton';

interface ChatInputProps {
  suggestionText?: string | null;
  onSuggestionUsed?: () => void;
}

interface Attachment {
  url: string;
  filename: string;
}

export function ChatInput({ suggestionText, onSuggestionUsed }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => (prev ? prev + ' ' + text : text));
  };

  const handleUpload = (url: string, filename: string) => {
    setAttachments(prev => [...prev, { url, filename }]);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // Could show a toast notification here
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const messageToSend = input.trim();

    // TODO: Handle attachments in message
    // For now, just include URLs in the message text
    const fullMessage = messageToSend +
      (attachments.length > 0
        ? '\n\n' + attachments.map(a => `[${a.filename}](${a.url})`).join('\n')
        : '');

    setInput('');
    setAttachments([]);
    await sendMessage(fullMessage);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
            >
              <span className="max-w-[200px] truncate" title={attachment.filename}>
                {attachment.filename}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Eki kaldır"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <AttachmentButton
          onUpload={handleUpload}
          onError={handleUploadError}
        />

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

        {/* Voice button */}
        <VoiceButton onTranscript={handleVoiceTranscript} />

        {/* Send button */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={(!input.trim() && attachments.length === 0) || isLoading}
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
