import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'flex flex-col gap-1 max-w-[80%]',
        isUser ? 'self-end items-end' : 'self-start items-start'
      )}
    >
      <div
        className={cn(
          'px-4 py-2 rounded-2xl',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">{time}</span>
        {isUser && (
          <span className="text-xs text-gray-500">
            {message.status === 'sending' && '⏳'}
            {message.status === 'sent' && '✓'}
            {message.status === 'error' && '⚠'}
          </span>
        )}
      </div>
    </div>
  );
}
