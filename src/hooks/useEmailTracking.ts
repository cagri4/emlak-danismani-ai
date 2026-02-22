import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { EmailRecord } from '@/types/email';

export function useEmailTracking(customerId: string) {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !customerId) {
      setLoading(false);
      return;
    }

    // Subscribe to emails for this customer
    const emailsRef = collection(
      db,
      'users',
      user.uid,
      'customers',
      customerId,
      'emails'
    );
    const q = query(emailsRef, orderBy('sentAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const emailList: EmailRecord[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            emailId: data.emailId,
            propertyId: data.propertyId,
            subject: data.subject,
            status: data.status,
            sentAt: data.sentAt,
            events: data.events || [],
            lastUpdated: data.lastUpdated,
          };
        });
        setEmails(emailList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching emails:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, customerId]);

  return { emails, loading };
}
