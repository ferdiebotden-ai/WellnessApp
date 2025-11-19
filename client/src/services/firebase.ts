import { Platform } from 'react-native';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';

// Platform-specific imports
let getReactNativePersistence: typeof import('firebase/auth').getReactNativePersistence | null = null;
let browserLocalPersistence: typeof import('firebase/auth').browserLocalPersistence | null = null;
let persistentLocalCache: typeof import('firebase/firestore').persistentLocalCache | null = null;
let persistentMultipleTabManager: typeof import('firebase/firestore').persistentMultipleTabManager | null = null;

if (Platform.OS === 'web') {
  // Web-specific imports
  try {
    const authModule = require('firebase/auth');
    browserLocalPersistence = authModule.browserLocalPersistence;
  } catch (e) {
    console.warn('Failed to import browserLocalPersistence');
  }
  try {
    const firestoreModule = require('firebase/firestore');
    persistentLocalCache = firestoreModule.persistentLocalCache;
    persistentMultipleTabManager = firestoreModule.persistentMultipleTabManager;
  } catch (e) {
    console.warn('Failed to import Firestore web persistence');
  }
} else {
  // React Native imports
  try {
    const authModule = require('firebase/auth');
    getReactNativePersistence = authModule.getReactNativePersistence;
  } catch (e) {
    console.warn('Failed to import getReactNativePersistence');
  }
}

// Detect if AsyncStorage native module is actually present in the bundle
let ReactNativeAsyncStorage: typeof import('@react-native-async-storage/async-storage').default | null = null;
let isUsingMemoryPersistence = false;
let hasLoggedPersistenceWarning = false;

if (Platform.OS !== 'web') {
  try {
    // Try to import AsyncStorage synchronously
    const AsyncStorageModule = require('@react-native-async-storage/async-storage');
    ReactNativeAsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
    
    // Verify the module is actually functional by checking for a method
    if (ReactNativeAsyncStorage && typeof ReactNativeAsyncStorage.getItem === 'function') {
      console.log('✅ AsyncStorage native module loaded successfully');
    } else {
      throw new Error('AsyncStorage module loaded but not functional');
    }
  } catch (error) {
    // Native module not linked or not functional - gracefully degrade
    const errorMessage = error instanceof Error ? error.message : String(error);
    isUsingMemoryPersistence = true;
    if (!hasLoggedPersistenceWarning) {
      console.log(
        `ℹ️ AsyncStorage not available (native module not found). Auth and Firestore will use memory-only persistence.\n` +
        `   Error: ${errorMessage}\n` +
        `   To enable persistence: Rebuild native app with 'npx expo prebuild' and 'npx expo run:ios'`
      );
      hasLoggedPersistenceWarning = true;
    }
    ReactNativeAsyncStorage = null;
  }
}

// Export persistence status for other modules
export const isUsingMemoryPersistenceMode = isUsingMemoryPersistence;

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
    console.log(
      '✅ Firebase configuration loaded successfully:\n' +
        `  Project ID: ${firebaseConfig.projectId}\n` +
        `  Auth Domain: ${firebaseConfig.authDomain}`
    );
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

  // Web platform: use web-specific persistence
  if (Platform.OS === 'web') {
    try {
      if (persistentLocalCache && persistentMultipleTabManager) {
        cachedDb = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
        console.log('WEB: Firestore initialized with web persistence');
        return cachedDb;
      } else {
        // Fallback to standard Firestore
        cachedDb = getFirestore(app);
        console.log('WEB: Firestore initialized (standard mode)');
        return cachedDb;
      }
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
      if (!hasLoggedPersistenceWarning) {
        console.log('Firestore initialized with memory-only cache (AsyncStorage unavailable)');
      }
      return cachedDb;
    } catch (error) {
      console.error('Failed to initialize Firestore with memory cache:', error);
      // Fallback to standard initialization
      try {
        cachedDb = getFirestore(app);
        console.log('Firestore initialized (fallback mode - no cache)');
        return cachedDb;
      } catch (fallbackError) {
        console.error('Failed to initialize Firestore:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // Standard initialization when AsyncStorage is available
  try {
    cachedDb = getFirestore(app);
    console.log('Firestore initialized with persistent cache');
    return cachedDb;
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw error;
  }
};

/**
 * Gets or initializes Firebase Auth with platform-appropriate persistence.
 * - Web: Uses browserLocalPersistence
 * - React Native: Uses AsyncStorage persistence via getReactNativePersistence
 */
export const getFirebaseAuth = (): Auth => {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app = getFirebaseApp();

  // Web platform: use browser persistence
  if (Platform.OS === 'web') {
    try {
      if (browserLocalPersistence) {
        cachedAuth = initializeAuth(app, {
          persistence: browserLocalPersistence,
        });
        console.log('WEB: Firebase Auth initialized with browser persistence');
        return cachedAuth;
      } else {
        // Fallback to standard getAuth
        cachedAuth = getAuth(app);
        console.log('WEB: Firebase Auth initialized (standard mode)');
        return cachedAuth;
      }
    } catch (error) {
      // Auth might already be initialized
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('already initialized') ||
        errorMessage.includes('already exists')
      ) {
        try {
          cachedAuth = getAuth(app);
          console.log('WEB: Using existing Firebase Auth instance');
          return cachedAuth;
        } catch (getAuthError) {
          console.error('Failed to get existing auth instance:', getAuthError);
          throw getAuthError;
        }
      } else {
        console.error('Failed to initialize Firebase Auth on web:', error);
        throw error;
      }
    }
  }

  // React Native: Use AsyncStorage persistence
  if (ReactNativeAsyncStorage && getReactNativePersistence) {
    try {
      cachedAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
      return cachedAuth;
    } catch (error) {
      // If initializeAuth fails (e.g., auth already initialized elsewhere),
      // fall back to getAuth
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('already initialized') ||
        errorMessage.includes('already exists')
      ) {
        // Auth was already initialized, get the existing instance
        try {
          cachedAuth = getAuth(app);
          console.warn(
            'Auth already initialized, using existing instance without persistence'
          );
          return cachedAuth;
        } catch (getAuthError) {
          console.error('Failed to get existing auth instance:', getAuthError);
          throw getAuthError;
        }
      } else {
        // Unexpected error during initialization
        console.error('Failed to initialize Firebase Auth:', error);
        throw error;
      }
    }
  } else {
    // AsyncStorage not available - initialize without persistence
    // This will work but auth won't persist between app restarts
    try {
      cachedAuth = initializeAuth(app);
      return cachedAuth;
    } catch (error) {
      // If initializeAuth fails, try getAuth
      try {
        cachedAuth = getAuth(app);
        return cachedAuth;
      } catch (getAuthError) {
        console.error('Failed to initialize Firebase Auth:', getAuthError);
        throw getAuthError;
      }
    }
  }
};

export const firebaseAuth = getFirebaseAuth();
export const firebaseDb = initializeOfflineFirestore(getFirebaseApp());
