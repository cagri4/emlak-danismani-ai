import { useEffect, useRef } from 'react';
import { ChatBubble } from './ChatBubble';
import { useChatContext } from './ChatProvider';
import { Loader2 } from 'lucide-react';

export function ChatMessages() {
  const { messages, isLoading } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-center px-4">
          <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 self-start">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI yanıt yazıyor...</span>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
