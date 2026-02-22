export interface EmailEvent {
  type: string;
  timestamp: Date | { toDate: () => Date };
  data: Record<string, any>;
}

export type EmailStatus = 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed';

export interface EmailRecord {
  id: string;
  emailId: string;           // Resend email ID
  propertyId: string;
  subject: string;
  status: EmailStatus;
  sentAt: Date | { toDate: () => Date };
  events: EmailEvent[];
  lastUpdated?: Date | { toDate: () => Date };
}
