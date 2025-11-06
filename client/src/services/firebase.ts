import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-auth-domain.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-storage-bucket.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:demoappid',
};

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (cachedApp) {
    return cachedApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    cachedApp = existingApps[0];
    return cachedApp;
  }

  cachedApp = initializeApp(firebaseConfig);
  return cachedApp;
};

const initializeOfflineFirestore = (app: FirebaseApp): Firestore => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    cachedDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
    });
    return cachedDb;
  } catch (error) {
    // Fallback for environments (like Jest or unsupported runtimes) that cannot enable persistence.
    cachedDb = getFirestore(app);
    return cachedDb;
  }
};

export const firebaseAuth = getAuth(getFirebaseApp());
export const firebaseDb = initializeOfflineFirestore(getFirebaseApp());
