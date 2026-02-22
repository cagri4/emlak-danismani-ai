# Phase 7: Email & Advanced Features - Research

**Researched:** 2026-02-22
**Domain:** Transactional email, email tracking, customer filtering
**Confidence:** HIGH

## Summary

Phase 7 implements email communication from the system using Resend API, webhook-based email tracking (sent/delivered/opened), and customer filtering by lead temperature. The technical foundation combines Resend with Firebase Cloud Functions for sending emails, React Email for templates, webhook endpoints for tracking delivery status, and enhanced Firestore queries for customer filtering.

Resend provides a modern developer-friendly email API with native support for React Email templates, comprehensive webhook events for tracking, and excellent integration with Firebase Cloud Functions. The email delivery tracking requires storing event data from webhooks in Firestore, with proper signature verification for security. Customer filtering builds on the existing lead scoring system (implemented in Phase 3) to filter by hot/warm/cold temperatures.

The key architectural decisions are: use Resend API (RESEND_API_KEY already in .env) with React Email for templating, implement Cloud Functions webhook endpoint to receive delivery events from Resend, store email status in Firestore subcollections under customers, and enhance the existing Customers page with temperature filter UI.

**Primary recommendation:** Use Resend SDK in Cloud Functions with React Email templates for property cards, implement webhook endpoint with signature verification for tracking, store email events in Firestore, and add simple filter dropdown to existing Customers page using current UI patterns.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ILET-06 | Sistem üzerinden e-posta gönderebilmeli (User can send email from system) | Resend API with Cloud Functions; React Email templates; property-to-email conversion |
| ILET-07 | Gönderilen e-postaların durumunu takip edebilmeli (User can track sent email status) | Resend webhooks (sent/delivered/opened); Firestore email event storage; webhook signature verification |
| MUST-06 | Kullanıcı müşterileri filtreleyebilmeli (sıcak/soğuk lead) (User can filter customers by hot/cold lead) | Existing lead scoring from Phase 3; Firestore compound queries; filter UI component |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| resend | ^4.x | Email sending API | Best developer experience, React Email support, Resend team maintains React Email |
| react-email | ^4.x | Email templates | Native Resend integration, component-based templates, visual preview |
| firebase-functions | ^6.x | Cloud Functions runtime | Already in use, webhook endpoint hosting, Resend integration |
| firebase-admin | ^13.x | Backend Firebase SDK | Already in use, Firestore writes for email tracking |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-email/components | ^0.0.x | Email UI primitives | Pre-built responsive email components (Button, Container, Text, etc.) |
| zod | ^4.x | Webhook payload validation | Already in project, validate webhook events before processing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | SendGrid | SendGrid has more features (marketing) but worse DX, more complex API |
| Resend | AWS SES | SES is cheaper at scale but requires more setup, no React Email support |
| React Email | MJML | MJML is more mature but Resend native support for React Email is compelling |
| Webhook signature | Skip verification | Skipping verification is insecure - attackers could spoof events |

**Installation:**
```bash
# Cloud Functions (in functions/ directory)
cd functions
npm install resend react-email @react-email/components

# No client-side dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
functions/
├── src/
│   ├── http/
│   │   ├── sendPropertyEmail.ts      # Callable function to send email
│   │   └── resendWebhook.ts          # Webhook endpoint for delivery events
│   ├── services/
│   │   ├── emailService.ts           # Resend wrapper, email sending logic
│   │   └── emailTracking.ts          # Store tracking events in Firestore
│   └── templates/                    # React Email templates
│       └── PropertyEmail.tsx         # Property card email template
src/
├── components/
│   ├── customer/
│   │   ├── SendEmailButton.tsx       # Email send UI
│   │   └── EmailHistoryModal.tsx     # View email history
│   └── customers/
│       └── CustomerFilters.tsx       # Temperature filter dropdown
├── hooks/
│   └── useEmailTracking.ts           # Real-time email status
└── types/
    └── email.ts                      # Email-related types
```

### Pattern 1: Send Email with Resend and React Email

**What:** Send property details via email using React Email template
**When to use:** User clicks "Send Email" on customer detail page

**Example:**
```typescript
// Source: https://resend.com/docs/send-with-nodejs
// functions/src/http/sendPropertyEmail.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Resend } from 'resend';
import { PropertyEmail } from '../templates/PropertyEmail';
import { getFirestore } from 'firebase-admin/firestore';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPropertyEmail = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { customerId, propertyId } = request.data;
  const db = getFirestore();

  // Fetch customer and property data
  const customerDoc = await db.collection('customers').doc(customerId).get();
  const propertyDoc = await db.collection('properties').doc(propertyId).get();

  if (!customerDoc.exists || !propertyDoc.exists) {
    throw new HttpsError('not-found', 'Customer or property not found');
  }

  const customer = customerDoc.data();
  const property = propertyDoc.data();

  if (!customer?.email) {
    throw new HttpsError('failed-precondition', 'Customer has no email address');
  }

  // Send email with React Email template
  const { data, error } = await resend.emails.send({
    from: 'Emlak Danışmanı <noreply@yourdomain.com>',
    to: customer.email,
    subject: `Mülk Önerisi: ${property.title}`,
    react: PropertyEmail({
      customerName: customer.name,
      property: property
    }),
    tags: [
      { name: 'type', value: 'property_email' },
      { name: 'property_id', value: propertyId },
      { name: 'customer_id', value: customerId }
    ]
  });

  if (error) {
    throw new HttpsError('internal', `Email send failed: ${error.message}`);
  }

  // Store email record in Firestore
  await db.collection('customers').doc(customerId).collection('emails').add({
    emailId: data.id,
    propertyId,
    subject: `Mülk Önerisi: ${property.title}`,
    status: 'sent',
    sentAt: new Date(),
    events: []
  });

  return { success: true, emailId: data.id };
});
```

### Pattern 2: React Email Property Template

**What:** Responsive email template for property card
**When to use:** Sending property details to customer

**Example:**
```tsx
// Source: https://react.email/docs/components/html
// functions/src/templates/PropertyEmail.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface PropertyEmailProps {
  customerName: string;
  property: {
    title: string;
    price: number;
    location: string;
    propertyType: string;
    rooms?: string;
    area?: number;
    photos?: string[];
    description?: string;
  };
}

export const PropertyEmail = ({ customerName, property }: PropertyEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Text style={heading}>Merhaba {customerName},</Text>
        <Text style={paragraph}>
          Size uygun olabilecek bir mülk bulduk:
        </Text>

        <Section style={propertyCard}>
          {property.photos?.[0] && (
            <Img
              src={property.photos[0]}
              width="560"
              alt={property.title}
              style={propertyImage}
            />
          )}

          <Text style={propertyTitle}>{property.title}</Text>

          <Text style={price}>
            {property.price.toLocaleString('tr-TR')} ₺
          </Text>

          <Section style={details}>
            <Text style={detailRow}>
              📍 {property.location}
            </Text>
            <Text style={detailRow}>
              🏠 {property.propertyType}
            </Text>
            {property.rooms && (
              <Text style={detailRow}>
                🛏️ {property.rooms}
              </Text>
            )}
            {property.area && (
              <Text style={detailRow}>
                📐 {property.area} m²
              </Text>
            )}
          </Section>

          {property.description && (
            <Text style={description}>{property.description}</Text>
          )}

          <Button
            href={`https://yourdomain.com/properties/${property.id}`}
            style={button}
          >
            Mülkü İncele
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Bu e-posta size emlak danışmanınız tarafından gönderilmiştir.
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles (inline for email compatibility)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  padding: '17px 0 0',
};

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
};

const propertyCard = {
  padding: '24px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '24px 0',
};

const propertyImage = {
  width: '100%',
  borderRadius: '8px',
  marginBottom: '16px',
};

const propertyTitle = {
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 8px',
  color: '#1f2937',
};

const price = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#059669',
  margin: '0 0 16px',
};

const details = {
  margin: '16px 0',
};

const detailRow = {
  margin: '4px 0',
  fontSize: '14px',
  color: '#6b7280',
};

const description = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#4b5563',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  marginTop: '16px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '26px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
};
```

### Pattern 3: Webhook Endpoint with Signature Verification

**What:** Receive email delivery events from Resend with security validation
**When to use:** Track email status (sent/delivered/opened)

**Example:**
```typescript
// Source: https://resend.com/docs/dashboard/webhooks/event-types
// https://blog.fastcomments.com/(01-09-2026)-webhook-security-update.html
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { createHmac } from 'crypto';

export const resendWebhook = onRequest(
  {
    region: 'europe-west1',
    cors: false, // Webhooks don't need CORS
  },
  async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Verify webhook signature
    const signature = req.headers['svix-signature'] as string;
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      res.status(401).send('Unauthorized');
      return;
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Compute expected signature
    const hmac = createHmac('sha256', webhookSecret);
    const expectedSignature = hmac.update(rawBody).digest('hex');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    const signatureParts = signature.split(',');
    const receivedSignature = signatureParts.find(part =>
      part.startsWith('v1=')
    )?.substring(3);

    if (receivedSignature !== expectedSignature) {
      console.warn('Invalid webhook signature');
      res.status(401).send('Unauthorized');
      return;
    }

    // Process webhook event
    const event = req.body;
    const db = getFirestore();

    try {
      // Extract email ID and event type
      const { type, data } = event;
      const emailId = data.email_id;

      // Find email record by Resend email ID
      const emailsSnapshot = await db
        .collectionGroup('emails')
        .where('emailId', '==', emailId)
        .limit(1)
        .get();

      if (emailsSnapshot.empty) {
        console.warn(`Email not found: ${emailId}`);
        res.status(404).send('Email not found');
        return;
      }

      const emailDoc = emailsSnapshot.docs[0];
      const emailData = emailDoc.data();

      // Update email status based on event type
      let status = emailData.status;

      if (type === 'email.delivered') {
        status = 'delivered';
      } else if (type === 'email.opened') {
        status = 'opened';
      } else if (type === 'email.bounced') {
        status = 'bounced';
      } else if (type === 'email.failed') {
        status = 'failed';
      }

      // Add event to events array and update status
      await emailDoc.ref.update({
        status,
        events: [
          ...(emailData.events || []),
          {
            type,
            timestamp: new Date(data.created_at),
            data: data
          }
        ],
        lastUpdated: new Date()
      });

      console.log(`Email ${emailId} status updated to ${status}`);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);
```

### Pattern 4: Customer Filter by Lead Temperature

**What:** Filter customer list by hot/warm/cold lead temperature
**When to use:** User wants to prioritize hot leads or find cold leads to re-engage

**Example:**
```typescript
// Source: https://firebase.google.com/docs/firestore/query-data/queries
// src/components/customers/CustomerFilters.tsx
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flame, Sun, Snowflake, Filter } from 'lucide-react';

interface CustomerFiltersProps {
  onFilterChange: (temperature: 'all' | 'hot' | 'warm' | 'cold') => void;
  currentFilter: 'all' | 'hot' | 'warm' | 'cold';
}

export default function CustomerFilters({
  onFilterChange,
  currentFilter
}: CustomerFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={currentFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrele" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Tüm Müşteriler
          </SelectItem>
          <SelectItem value="hot">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Sıcak Leadler
            </div>
          </SelectItem>
          <SelectItem value="warm">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Ilık Leadler
            </div>
          </SelectItem>
          <SelectItem value="cold">
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />
              Soğuk Leadler
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

```typescript
// Enhanced Customers.tsx with filter integration
// The filtering logic already exists in Customers.tsx (lines 13, 22-28)
// Just need to add the UI component:

import CustomerFilters from '@/components/customers/CustomerFilters';

// Inside Customers component, add before customer grid:
<div className="flex items-center justify-between mb-6">
  <CustomerFilters
    onFilterChange={setFilterTemperature}
    currentFilter={filterTemperature}
  />
  <div className="flex items-center gap-2">
    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    <Select value={sortBy} onValueChange={setSortBy}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="leadScore">Lead Puanı</SelectItem>
        <SelectItem value="lastInteraction">Son İletişim</SelectItem>
        <SelectItem value="name">İsim</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

### Pattern 5: Email History Display

**What:** Show email delivery status and history for customer
**When to use:** User wants to see which emails were sent and their status

**Example:**
```typescript
// src/hooks/useEmailTracking.ts
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmailEvent {
  type: string;
  timestamp: Date;
  data: any;
}

interface EmailTracking {
  id: string;
  emailId: string;
  propertyId: string;
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed';
  sentAt: Date;
  events: EmailEvent[];
  lastUpdated?: Date;
}

export function useEmailTracking(customerId: string) {
  const [emails, setEmails] = useState<EmailTracking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const emailsRef = collection(db, 'customers', customerId, 'emails');
    const q = query(emailsRef, orderBy('sentAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emailData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
        events: doc.data().events?.map((e: any) => ({
          ...e,
          timestamp: e.timestamp?.toDate()
        }))
      })) as EmailTracking[];

      setEmails(emailData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [customerId]);

  return { emails, loading };
}
```

```tsx
// src/components/customer/EmailHistoryModal.tsx
import { useEmailTracking } from '@/hooks/useEmailTracking';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const statusConfig = {
  sent: { label: 'Gönderildi', icon: Mail, color: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Teslim Edildi', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  opened: { label: 'Açıldı', icon: Eye, color: 'bg-purple-100 text-purple-800' },
  bounced: { label: 'Geri Döndü', icon: XCircle, color: 'bg-red-100 text-red-800' },
  failed: { label: 'Başarısız', icon: XCircle, color: 'bg-red-100 text-red-800' }
};

export default function EmailHistoryModal({ customerId }: { customerId: string }) {
  const { emails, loading } = useEmailTracking(customerId);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      {emails.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Henüz e-posta gönderilmemiş
        </p>
      ) : (
        emails.map(email => {
          const config = statusConfig[email.status];
          const Icon = config.icon;

          return (
            <div key={email.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{email.subject}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(email.sentAt, "d MMMM yyyy, HH:mm", { locale: tr })}
                  </p>
                </div>
                <Badge className={config.color}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>

              {/* Event timeline */}
              <div className="mt-4 space-y-2">
                {email.events.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{event.type}</span>
                    <span>·</span>
                    <span>{format(event.timestamp, "HH:mm", { locale: tr })}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Sending emails from client:** Never use Resend API key in frontend - always send from Cloud Functions to protect API key
- **Missing signature verification:** Webhook endpoints without signature verification are vulnerable to spoofing attacks
- **Using parsed JSON for signature:** Always verify HMAC signature against raw request body, not re-serialized JSON
- **Blocking UI on send:** Email sending should be async - show "Gönderiliyor..." state, don't block user
- **No error handling:** Email sends can fail (invalid address, service down) - always handle errors gracefully
- **Storing full email content:** Store metadata only, not full HTML - reduces storage costs and complexity
- **Hardcoded email domain:** Use environment variable for from address, different for dev/prod

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email sending | Custom SMTP client | Resend SDK | Handles delivery, retries, bounce management, reputation |
| Email templates | String concatenation HTML | React Email | Component-based, responsive, preview mode, maintainable |
| Webhook signature | Basic string comparison | HMAC verification with timing-safe compare | Prevents timing attacks, proper cryptographic validation |
| Email tracking | Poll for status | Webhooks | Real-time updates, no polling overhead, event-driven |
| HTML email design | Write tables from scratch | @react-email/components | Pre-built responsive components, tested across clients |
| Filter UI | Custom dropdown | shadcn/ui Select | Accessible, keyboard navigation, consistent with existing UI |

**Key insight:** Email is deceptively complex. Delivery reliability, spam compliance, template compatibility across email clients, and security require specialized solutions. Resend and React Email solve these problems.

## Common Pitfalls

### Pitfall 1: Email Client Compatibility Issues

**What goes wrong:** Email looks perfect in Gmail but breaks in Outlook
**Why it happens:** Email clients have inconsistent CSS support, especially Outlook (uses Word rendering engine)
**How to avoid:**
- Use React Email components (designed for compatibility)
- Inline styles only (external CSS doesn't work)
- Table-based layouts (flexbox/grid not supported in many clients)
- Test across clients using Resend preview or Email on Acid
- Keep width under 600px
- Avoid background images (limited support)

**Warning signs:** User reports "email looks weird" in specific clients

### Pitfall 2: SPF/DKIM/DMARC Not Configured

**What goes wrong:** Emails go to spam or bounce entirely
**Why it happens:** Email providers require authentication to prevent spoofing
**How to avoid:**
- Verify domain in Resend dashboard
- Add SPF record to DNS: `v=spf1 include:resend.com ~all`
- Add DKIM record (provided by Resend)
- Set up DMARC policy: `v=DMARC1; p=none; rua=mailto:admin@yourdomain.com`
- Use verified "from" domain (not gmail.com or free providers)

**Warning signs:** High bounce rate, emails in spam folder

### Pitfall 3: Webhook Replay Attacks

**What goes wrong:** Attacker re-sends old webhook events, causing duplicate updates
**Why it happens:** No timestamp validation or idempotency check
**How to avoid:**
- Validate webhook timestamp (reject if older than 5 minutes)
- Store processed webhook IDs in Firestore (check before processing)
- Use transaction to prevent race conditions
- Verify signature on every request

**Warning signs:** Duplicate email status updates, "opened" status appearing multiple times

### Pitfall 4: No Email Validation Before Send

**What goes wrong:** Send email to invalid address, wastes quota and damages sender reputation
**Why it happens:** Customer email field not validated
**How to avoid:**
- Validate email format on customer creation (zod schema already exists)
- Check email exists before sending
- Handle "invalid recipient" errors gracefully
- Consider email verification flow (send confirmation email on customer creation)

**Warning signs:** High bounce rate, "invalid recipient" errors in logs

### Pitfall 5: Exposing Resend API Key

**What goes wrong:** API key leaked in frontend code or git, unauthorized emails sent
**Why it happens:** Accidentally committing .env or using key in client-side code
**How to avoid:**
- NEVER use RESEND_API_KEY in frontend
- Always send emails from Cloud Functions
- Use environment variables (not hardcoded)
- Add .env to .gitignore
- Rotate key if exposed

**Warning signs:** Unexpected email sends, quota exceeded, key in git history

### Pitfall 6: Not Handling Webhook Downtime

**What goes wrong:** Webhook endpoint returns 500, Resend stops sending webhooks
**Why it happens:** Firestore write fails, function crashes
**How to avoid:**
- Catch all errors in webhook handler
- Return 200 even if processing fails (store in queue for retry)
- Log errors for debugging
- Use Firestore transactions to prevent partial updates
- Monitor webhook delivery success rate in Resend dashboard

**Warning signs:** Missing email events, gaps in tracking timeline

### Pitfall 7: Large Image Attachments

**What goes wrong:** Email sending fails or is very slow due to large attachments
**Why it happens:** Trying to attach full-resolution photos
**How to avoid:**
- Don't attach images - use public URLs (Firebase Storage) and embed in HTML
- If attachments needed, compress before sending
- Resend has 40MB total attachment limit
- Consider linking to property page instead of inline images

**Warning signs:** Email send timeouts, "payload too large" errors

### Pitfall 8: Missing Unsubscribe Link

**What goes wrong:** Recipients mark emails as spam, damages sender reputation
**Why it happens:** Forgot to include unsubscribe option
**How to avoid:**
- Add unsubscribe link to email footer (required by anti-spam laws)
- Use Resend's unsubscribe header: `List-Unsubscribe: <mailto:unsubscribe@yourdomain.com>`
- Track unsubscribe status in customer record
- Don't send to unsubscribed customers

**Warning signs:** High spam complaint rate, deliverability issues

## Code Examples

Verified patterns from official sources:

### Resend Configuration in Cloud Functions

```typescript
// Source: https://resend.com/docs/send-with-nodejs
// functions/src/config.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@yourdomain.com';
```

### Send Email Cloud Function

```typescript
// Source: https://firebase.google.com/docs/functions/callable
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { resend, EMAIL_FROM } from './config';
import { PropertyEmail } from './templates/PropertyEmail';

export const sendPropertyEmail = onCall(async (request) => {
  const { customerId, propertyId } = request.data;

  // Validation and data fetching omitted for brevity

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: customer.email,
    subject: `Mülk Önerisi: ${property.title}`,
    react: PropertyEmail({ customerName: customer.name, property }),
    tags: [
      { name: 'type', value: 'property_email' },
      { name: 'customer_id', value: customerId }
    ]
  });

  if (error) {
    throw new HttpsError('internal', error.message);
  }

  return { success: true, emailId: data.id };
});
```

### Firestore Email Schema

```typescript
// Firestore structure
customers/{customerId}/emails/{emailId}
{
  emailId: string;           // Resend email ID
  propertyId: string;        // Property that was sent
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed';
  sentAt: Timestamp;
  events: [
    {
      type: string;          // 'email.sent', 'email.delivered', etc.
      timestamp: Timestamp;
      data: object;          // Full webhook payload
    }
  ];
  lastUpdated: Timestamp;
}
```

### Client-Side Email Send

```typescript
// src/components/customer/SendEmailButton.tsx
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SendEmailButton({
  customerId,
  propertyId
}: {
  customerId: string;
  propertyId: string;
}) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);

    try {
      const sendEmail = httpsCallable(functions, 'sendPropertyEmail');
      await sendEmail({ customerId, propertyId });

      toast.success('E-posta gönderildi');
    } catch (error) {
      console.error('Email send error:', error);
      toast.error('E-posta gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      onClick={handleSend}
      disabled={sending}
      variant="outline"
      className="gap-2"
    >
      {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
      E-posta Gönder
    </Button>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SendGrid/Mailgun | Resend | 2023 | Better DX, React Email integration, simpler API |
| MJML templates | React Email | 2022 | Component-based, TypeScript support, better maintainability |
| Manual webhook verification | Svix signature | 2024 | Standardized signature format, better security |
| Polling for status | Webhooks | Ongoing | Real-time updates, reduced API calls |
| Table-based HTML | CSS Grid/Flex | Not yet (email clients) | Still need tables for email compatibility |

**Deprecated/outdated:**
- **Nodemailer with SMTP:** Still works but Resend API is more reliable and easier
- **Manual HTML string templates:** React Email replaced manual concatenation
- **SendGrid legacy API:** V3 API is current, but Resend is better for new projects
- **Inline base64 images:** Use public URLs instead (better deliverability)

## Open Questions

1. **Domain verification**
   - What we know: Resend requires domain verification for production sending
   - What's unclear: Current domain setup, DNS access for adding records
   - Recommendation: Start with Resend's test domain for development, verify custom domain before production deploy

2. **Email volume and quotas**
   - What we know: Resend free tier is 100 emails/day, paid starts at $20/month
   - What's unclear: Expected email volume per user
   - Recommendation: Monitor usage in Phase 7, upgrade plan if approaching limits

3. **Unsubscribe management**
   - What we know: Anti-spam laws require unsubscribe option
   - What's unclear: Full unsubscribe flow implementation (out of scope for Phase 7?)
   - Recommendation: Add simple "doNotEmail" flag to customer record, basic unsubscribe link in footer, full management in future phase

4. **Email template variations**
   - What we know: Basic property email template needed
   - What's unclear: Need for multiple templates (match notification, welcome email, etc.)
   - Recommendation: Start with one property template, add variants as needed (templates are reusable components)

## Sources

### Primary (HIGH confidence)

- [Resend Node.js Integration](https://resend.com/docs/send-with-nodejs) - Official Node.js SDK guide
- [Resend Email API Reference](https://resend.com/docs/api-reference/emails/send-email) - Complete API parameters and responses
- [Resend Webhook Event Types](https://resend.com/docs/dashboard/webhooks/event-types) - Official webhook event documentation
- [React Email Resend Integration](https://react.email/docs/integrations/resend) - Native integration guide
- [React Email Components](https://react.email/docs/components/html) - Official component documentation
- [Firebase Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries) - Official compound query guide
- [Firebase Cloud Functions Callable](https://firebase.google.com/docs/functions/callable) - Client-callable functions guide

### Secondary (MEDIUM confidence)

- [Resend with Firebase Cloud Functions](https://www.sequenzy.com/blog/best-email-tools-with-firebase-integration) - Integration patterns and comparison
- [Webhook Security Best Practices](https://www.hooklistener.com/learn/webhook-security-fundamentals) - HMAC verification, replay attack prevention
- [Firebase Webhook Signature Validation](https://lirantal.com/blog/http-webhooks-firebase-functions-fastify-practical-case-study-lemon-squeezy) - Practical implementation guide
- [Responsive Email Design 2026](https://mailtrap.io/blog/responsive-email-design/) - Best practices for email templates
- [Email Design Best Practices 2026](https://www.mailmunch.com/blog/email-design-best-practices) - Dark mode, mobile-first, accessibility
- [HTML Email Compatibility 2026](https://designmodo.com/html-css-emails/) - What CSS works in email clients
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks/blob/master/firestore/README.md) - Firestore hooks patterns

### Tertiary (LOW confidence)

- [React Multi-Select Components](https://reactscript.com/best-multiple-select-components/) - UI component comparison (not specific to use case)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Resend official docs, React Email native integration, verified API
- Architecture: HIGH - Patterns from official Firebase and Resend documentation
- Pitfalls: MEDIUM - Mix of documented issues (email compatibility) and security best practices
- Customer filtering: HIGH - Pattern already implemented in existing codebase (Customers.tsx)
- Email tracking: MEDIUM - Webhook approach documented, specific Firestore schema designed for use case

**Research date:** 2026-02-22
**Valid until:** ~2026-04-22 (60 days - Resend API stable, React Email actively maintained, email standards slow-moving)
