import { useRef, useEffect } from 'react';
import { useEmailTracking } from '@/hooks/useEmailTracking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, CheckCircle, Eye, XCircle, Clock, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { EmailStatus } from '@/types/email';

interface EmailHistoryModalProps {
  customerId: string;
  open: boolean;
  onClose: () => void;
}

const statusConfig: Record<EmailStatus, { label: string; icon: typeof Mail; color: string }> = {
  sent: { label: 'Gönderildi', icon: Mail, color: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Teslim Edildi', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  opened: { label: 'Açıldı', icon: Eye, color: 'bg-purple-100 text-purple-800' },
  bounced: { label: 'Geri Döndü', icon: XCircle, color: 'bg-red-100 text-red-800' },
  failed: { label: 'Başarısız', icon: XCircle, color: 'bg-red-100 text-red-800' },
};

export function EmailHistoryModal({ customerId, open, onClose }: EmailHistoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { emails, loading } = useEmailTracking(customerId);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card ref={modalRef} className="w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">E-posta Geçmişi</h2>
            <p className="text-sm text-muted-foreground">
              Gönderilen e-postaların teslim durumları
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Henüz e-posta gönderilmemiş</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => {
              const config = statusConfig[email.status];
              const StatusIcon = config.icon;
              const sentAt = email.sentAt instanceof Date
                ? email.sentAt
                : email.sentAt.toDate();

              return (
                <div key={email.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    {/* Email Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{email.subject}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(sentAt, 'd MMMM yyyy, HH:mm', { locale: tr })}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${config.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {config.label}
                    </div>
                  </div>

                  {/* Event Timeline (optional - show if events exist) */}
                  {email.events && email.events.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {email.events.map((event, idx) => {
                        const eventTime = event.timestamp instanceof Date
                          ? event.timestamp
                          : event.timestamp.toDate();

                        return (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{event.type.replace('email.', '')}</span>
                            <span>•</span>
                            <span>{format(eventTime, 'HH:mm:ss', { locale: tr })}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
