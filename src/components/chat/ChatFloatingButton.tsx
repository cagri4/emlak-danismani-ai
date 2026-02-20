import { MessageCircle } from 'lucide-react';
import { useChatContext } from './ChatProvider';
import { Button } from '@/components/ui/button';

export function ChatFloatingButton() {
  const { toggleChat } = useChatContext();

  return (
    <Button
      onClick={toggleChat}
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
      aria-label="Sohbet aç"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </Button>
  );
}
