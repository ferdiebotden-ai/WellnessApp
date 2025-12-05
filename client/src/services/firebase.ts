import { Platform } from 'react-native';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import {
  Auth,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// getReactNativePersistence is only available in React Native builds
// Import it conditionally to avoid TypeScript errors in web builds
let getReactNativePersistence: ((storage: unknown) => unknown) | undefined;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const authRN = require('firebase/auth');
    getReactNativePersistence = authRN.getReactNativePersistence;
  } catch {
    // Not available in this environment
  }
}

// Export persistence status for other modules
// This will be set when Firebase is actually initialized
let isUsingMemoryPersistence = false;
export const isUsingMemoryPersistenceMode = (): boolean => isUsingMemoryPersistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-auth-domain.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-storage-bucket.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:demoappid',
};

// Validate Firebase configuration (deferred to avoid early console output)
let configValidated = false;
const validateFirebaseConfig = () => {
  if (configValidated) return;
  configValidated = true;

  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = requiredKeys.filter(
    (key) =>
      !firebaseConfig[key as keyof typeof firebaseConfig] ||
      firebaseConfig[key as keyof typeof firebaseConfig].startsWith('demo-')
  );

  if (missing.length > 0) {
    console.error(
      '❌ Firebase configuration incomplete or using demo values.\n' +
        `Missing or invalid: ${missing.join(', ')}\n` +
        'Create a .env file in client/ directory with EXPO_PUBLIC_FIREBASE_* variables.\n' +
        'See client/EXPO_SETUP.md for instructions.'
    );
  } else {
    console.log(
      '✅ Firebase configuration loaded successfully:\n' +
        `  Project ID: ${firebaseConfig.projectId}\n` +
        `  Auth Domain: ${firebaseConfig.authDomain}`
    );
  }
};

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (cachedApp) {
    return cachedApp;
  }

  validateFirebaseConfig();

  const existingApps = getApps();
  if (existingApps.length > 0) {
    cachedApp = existingApps[0];
    return cachedApp;
  }

  cachedApp = initializeApp(firebaseConfig);
  return cachedApp;
};

/**
 * Detects if running in Expo Go (no native modules available).
 */
const isExpoGo = (): boolean => {
  try {
    const Constants = require('expo-constants').default;
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
};

/**
 * Gets or initializes Firebase Auth with platform-appropriate persistence.
 * - Expo Go: Uses inMemoryPersistence (no native modules required)
 * - Native builds: Uses AsyncStorage persistence
 * - Web: Uses browserLocalPersistence
 */
export const getFirebaseAuth = (): Auth => {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app = getFirebaseApp();

  // Web platform
  if (Platform.OS === 'web') {
    try {
      cachedAuth = initializeAuth(app, { persistence: browserLocalPersistence });
      console.log('WEB: Firebase Auth initialized');
      return cachedAuth;
    } catch (error) {
      cachedAuth = getAuth(app);
      return cachedAuth;
    }
  }

  // Expo Go: Use inMemoryPersistence (avoids native module errors)
  if (isExpoGo()) {
    isUsingMemoryPersistence = true;
    console.log('EXPO GO: Using in-memory persistence (auth state will not persist between restarts)');
    try {
      cachedAuth = initializeAuth(app, { persistence: inMemoryPersistence });
      return cachedAuth;
    } catch (error) {
      cachedAuth = getAuth(app);
      return cachedAuth;
    }
  }

  // Native build: Try AsyncStorage persistence
  try {
    const AsyncStorageModule = require('@react-native-async-storage/async-storage');
    const ReactNativeAsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

    if (ReactNativeAsyncStorage?.getItem && getReactNativePersistence) {
      cachedAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage) as Auth['config']['persistence'],
      });
      console.log('NATIVE: Firebase Auth with AsyncStorage persistence');
      return cachedAuth;
    }
  } catch (error) {
    console.warn('AsyncStorage unavailable:', error);
  }

  // Fallback: Memory persistence
  isUsingMemoryPersistence = true;
  try {
    cachedAuth = initializeAuth(app, { persistence: inMemoryPersistence });
    console.log('FALLBACK: Firebase Auth with memory persistence');
    return cachedAuth;
  } catch (error) {
    cachedAuth = getAuth(app);
    return cachedAuth;
  }
};

/**
 * Gets or initializes Firestore with appropriate caching.
 */
const initializeOfflineFirestore = (app: FirebaseApp): Firestore => {
  if (cachedDb) {
    return cachedDb;
  }

  // Dynamically import Firestore modules
  const { getFirestore, initializeFirestore, memoryLocalCache } = require('firebase/firestore');

  // Web platform: use web-specific persistence
  if (Platform.OS === 'web') {
    try {
      const { persistentLocalCache, persistentMultipleTabManager } = require('firebase/firestore');
      cachedDb = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
      console.log('WEB: Firestore initialized with web persistence');
      return cachedDb;
    } catch (error) {
      console.error('Failed to initialize Firestore web persistence:', error);
      cachedDb = getFirestore(app);
      return cachedDb;
    }
  }

  // React Native: Use memory cache when AsyncStorage is unavailable
  if (isUsingMemoryPersistence) {
    try {
      cachedDb = initializeFirestore(app, {
        localCache: memoryLocalCache(),
      });
      console.log('Firestore initialized with memory-only cache');
      return cachedDb;
    } catch (error) {
      console.error('Failed to initialize Firestore with memory cache:', error);
      cachedDb = getFirestore(app);
      return cachedDb;
    }
  }

  // Standard initialization
  try {
    cachedDb = getFirestore(app);
    console.log('Firestore initialized');
    return cachedDb;
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw error;
  }
};

// Lazy initialization via Proxy - delays Firebase initialization until first property access
// This ensures React Native's runtime is fully ready before Firebase tries to use native modules

let _lazyAuth: Auth | null = null;
let _lazyDb: Firestore | null = null;

/**
 * Gets the Firestore instance directly (not via Proxy).
 * Use this when passing to Firebase SDK functions like doc() or collection().
 */
export const getFirebaseDb = (): Firestore => {
  if (!_lazyDb) {
    _lazyDb = initializeOfflineFirestore(getFirebaseApp());
  }
  return _lazyDb;
};

/**
 * Lazily initialized Firebase Auth instance.
 * Firebase is only initialized when you first access a property on this object.
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
 * Firebase is only initialized when you first access a property on this object.
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
