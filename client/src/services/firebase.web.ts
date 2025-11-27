import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

export const isUsingMemoryPersistenceMode = (): boolean => false;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-auth-domain.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-storage-bucket.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:demoappid',
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = requiredKeys.filter(
    (key) =>
      !firebaseConfig[key] || firebaseConfig[key].startsWith('demo-')
  );

  if (missing.length > 0) {
    console.error(
      '❌ Firebase configuration incomplete or using demo values.\n' +
        `Missing or invalid: ${missing.join(', ')}\n` +
        'Create a .env file in client/ directory with EXPO_PUBLIC_FIREBASE_* variables.\n' +
        'See client/EXPO_SETUP.md for instructions.'
    );
  } else {
    console.log('WEB MOCK: Firebase config loaded');
  }
};

validateFirebaseConfig();

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

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
    });
    console.log('WEB MOCK: Firestore initialized with web persistence');
    return cachedDb;
  } catch (error) {
    console.error('Failed to initialize Firestore web persistence:', error);
    cachedDb = getFirestore(app);
    return cachedDb;
  }
};

export const getFirebaseAuth = (): Auth => {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app = getFirebaseApp();

  try {
    cachedAuth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
    return cachedAuth;
  } catch (error) {
    // Auth was already initialized, get the existing instance
    try {
      cachedAuth = getAuth(app);
      return cachedAuth;
    } catch (getAuthError) {
      console.error('Failed to get existing auth instance:', getAuthError);
      throw getAuthError;
    }
  }
};

// Lazy initialization - matches firebase.ts pattern for consistency

let _lazyAuth: Auth | null = null;
let _lazyDb: Firestore | null = null;

/**
 * Lazily initialized Firebase Auth instance.
 */
export const firebaseAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_lazyAuth) {
      _lazyAuth = getFirebaseAuth();
    }
    const value = (_lazyAuth as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(_lazyAuth);
    }
    return value;
  },
});

/**
 * Lazily initialized Firestore instance.
 */
export const firebaseDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_lazyDb) {
      _lazyDb = initializeOfflineFirestore(getFirebaseApp());
    }
    const value = (_lazyDb as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(_lazyDb);
    }
    return value;
  },
});

