import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export storage bucket reference
export const storage = admin.storage();
export const bucket = storage.bucket();

// Export Firestore database reference
export const db = admin.firestore();

// Region configuration for KVKK compliance
export const REGION = 'europe-west1';
