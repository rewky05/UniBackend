import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from './odyssey-test-db-firebase-adminsdk-fbsvc-e4f0ac88e9.json';

// Initialize Firebase Admin if not already initialized
export function initAdmin() {
  if (getApps().length === 0) {
    // Use the service account JSON file directly
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
      databaseURL: "https://odyssey-test-db-default-rtdb.asia-southeast1.firebasedatabase.app",
    });
  }
  return getAuth();
}

export { getAuth };
