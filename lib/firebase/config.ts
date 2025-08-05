import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC1w0tPJff953vbLjNDVCUBdFKZdw9m9lE",
  authDomain: "odyssey-test-db.firebaseapp.com",
  databaseURL: "https://odyssey-test-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "odyssey-test-db",
  storageBucket: "odyssey-test-db.firebasestorage.app",
  messagingSenderId: "795570037018",
  appId: "1:795570037018:web:da29a70ab225676ae68ca3",
  measurementId: "G-WX6N95FZYM"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Connect to emulators if in development
if (process.env.NODE_ENV === 'development') {
  // Uncomment these lines when you want to use Firebase emulators
  // connectDatabaseEmulator(db, 'localhost', 9000);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;