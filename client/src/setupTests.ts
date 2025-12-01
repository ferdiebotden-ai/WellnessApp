// Jest setup for Expo SDK 54 with React 19
// jest-expo handles most React Native mocking automatically

// Note: NativeAnimatedHelper mock removed - jest-expo handles this for RN 0.81+

// ============================================================================
// EXPO NATIVE MODULES
// ============================================================================

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
}));

// Mock expo-local-authentication (Face ID / Touch ID)
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1, 2]), // FINGERPRINT, FACIAL_RECOGNITION
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC: 2,
  },
}));

// Mock expo-secure-store (encrypted storage)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  ALWAYS: 'ALWAYS',
  ALWAYS_THIS_DEVICE_ONLY: 'ALWAYS_THIS_DEVICE_ONLY',
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Rigid: 'rigid',
    Soft: 'soft',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// ============================================================================
// REACT NATIVE COMMUNITY MODULES
// ============================================================================

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue({ service: 'test', storage: 'test' }),
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  setInternetCredentials: jest.fn().mockResolvedValue({ service: 'test', storage: 'test' }),
  getInternetCredentials: jest.fn().mockResolvedValue(false),
  resetInternetCredentials: jest.fn().mockResolvedValue(true),
  getSupportedBiometryType: jest.fn().mockResolvedValue('FaceID'),
  canImplyAuthentication: jest.fn().mockResolvedValue(true),
  BIOMETRY_TYPE: {
    TOUCH_ID: 'TouchID',
    FACE_ID: 'FaceID',
    FINGERPRINT: 'Fingerprint',
    FACE: 'Face',
    IRIS: 'Iris',
  },
  ACCESS_CONTROL: {
    USER_PRESENCE: 'UserPresence',
    BIOMETRY_ANY: 'BiometryAny',
    BIOMETRY_CURRENT_SET: 'BiometryCurrentSet',
    DEVICE_PASSCODE: 'DevicePasscode',
    APPLICATION_PASSWORD: 'ApplicationPassword',
    BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BiometryAnyOrDevicePasscode',
    BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BiometryCurrentSetOrDevicePasscode',
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
    AFTER_FIRST_UNLOCK: 'AccessibleAfterFirstUnlock',
    ALWAYS: 'AccessibleAlways',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
  },
  SECURITY_LEVEL: {
    SECURE_SOFTWARE: 'SECURE_SOFTWARE',
    SECURE_HARDWARE: 'SECURE_HARDWARE',
    ANY: 'ANY',
  },
  STORAGE_TYPE: {
    FB: 'FacebookConceal',
    AES: 'KeystoreAESCBC',
    RSA: 'KeystoreRSAECB',
  },
}));

// ============================================================================
// ANALYTICS & THIRD PARTY
// ============================================================================

// Mock mixpanel-react-native
jest.mock('mixpanel-react-native', () => ({
  Mixpanel: jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    track: jest.fn(),
    identify: jest.fn(),
    alias: jest.fn(),
    reset: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    getPeople: jest.fn().mockReturnValue({
      set: jest.fn(),
      setOnce: jest.fn(),
      increment: jest.fn(),
      append: jest.fn(),
      union: jest.fn(),
      remove: jest.fn(),
      unset: jest.fn(),
      deleteUser: jest.fn(),
    }),
    registerSuperProperties: jest.fn(),
    unregisterSuperProperty: jest.fn(),
    clearSuperProperties: jest.fn(),
    setLoggingEnabled: jest.fn(),
  })),
}));

// ============================================================================
// FIREBASE MODULES
// ============================================================================

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
}));

// Mock firebase/remote-config
jest.mock('firebase/remote-config', () => ({
  getRemoteConfig: jest.fn(() => ({
    defaultConfig: {},
    settings: { minimumFetchIntervalMillis: 0 },
    fetchAndActivate: jest.fn().mockResolvedValue(true),
    ensureInitialized: jest.fn().mockResolvedValue(undefined),
  })),
  getValue: jest.fn(() => ({
    asBoolean: jest.fn(() => true),
    asNumber: jest.fn(() => 0),
    asString: jest.fn(() => ''),
  })),
  fetchAndActivate: jest.fn().mockResolvedValue(true),
  ensureInitialized: jest.fn().mockResolvedValue(undefined),
  activate: jest.fn().mockResolvedValue(true),
  fetchConfig: jest.fn().mockResolvedValue(undefined),
  getAll: jest.fn(() => ({})),
  getString: jest.fn(() => ''),
  getNumber: jest.fn(() => 0),
  getBoolean: jest.fn(() => true),
}));

// Mock firebase/app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

// ============================================================================
// WEARABLES
// ============================================================================
// Note: react-native-health and react-native-google-fit are mocked inline
// in specific test files (e.g., aggregators.test.ts) since they're not
// installed as dependencies in all environments.

// ============================================================================
// TESTING LIBRARY EXTENSIONS
// ============================================================================

// Import testing-library jest-native matchers
import '@testing-library/jest-native/extend-expect';

// ============================================================================
// GLOBAL TEST CONFIGURATION
// ============================================================================

// Suppress console warnings in tests (optional - comment out if debugging)
// const originalWarn = console.warn;
// beforeAll(() => {
//   console.warn = (...args: Parameters<typeof console.warn>) => {
//     if (args[0]?.includes?.('Animated') || args[0]?.includes?.('useNativeDriver')) {
//       return;
//     }
//     originalWarn(...args);
//   };
// });
// afterAll(() => {
//   console.warn = originalWarn;
// });
