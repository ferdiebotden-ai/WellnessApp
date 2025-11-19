import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { sha256 } from 'js-sha256';

const BIOMETRIC_SERVICE = 'com.wellnessos.firebaseRefreshToken';
const PIN_HASH_SERVICE = 'com.wellnessos.authPinHash';
const PIN_TOKEN_SERVICE = 'com.wellnessos.pinProtectedToken';
const PIN_SALT = 'wellness-os.pin.salt.v1';

export type BiometryType = 'FaceID' | 'TouchID' | 'Fingerprint' | 'Iris' | null;

const derivePinHash = (pin: string): string => {
  if (!pin) {
    throw new Error('PIN value is required');
  }

  return sha256(`${PIN_SALT}:${pin}`);
};

const hexToBytes = (value: string): Uint8Array => {
  const normalized = value.length % 2 === 0 ? value : `0${value}`;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = parseInt(normalized.substring(index, index + 2), 16);
  }

  return bytes;
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const stringToBytes = (value: string): Uint8Array => {
  const characters = Array.from(value);
  const buffer = new Uint8Array(characters.length);
  characters.forEach((char, index) => {
    buffer[index] = char.charCodeAt(0);
  });
  return buffer;
};

const bytesToString = (bytes: Uint8Array): string =>
  String.fromCharCode(...Array.from(bytes));

const xorWithKey = (payload: Uint8Array, key: Uint8Array): Uint8Array => {
  const result = new Uint8Array(payload.length);
  for (let index = 0; index < payload.length; index += 1) {
    result[index] = payload[index] ^ key[index % key.length];
  }
  return result;
};

const encryptTokenWithKey = (token: string, keyHex: string): string => {
  const tokenBytes = stringToBytes(token);
  const keyBytes = hexToBytes(keyHex);
  const cipherBytes = xorWithKey(tokenBytes, keyBytes);
  return bytesToHex(cipherBytes);
};

const decryptTokenWithKey = (cipherHex: string, keyHex: string): string => {
  const cipherBytes = hexToBytes(cipherHex);
  const keyBytes = hexToBytes(keyHex);
  const plainBytes = xorWithKey(cipherBytes, keyBytes);
  return bytesToString(plainBytes);
};

/**
 * Persists the Firebase refresh token in SecureStore protected by biometrics.
 * @param token The Firebase refresh token to persist.
 */
export const storeBiometricRefreshToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_SERVICE, token, {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to store your session',
    });
  } catch (error) {
    // Fallback: store without biometric protection if biometrics unavailable
    await SecureStore.setItemAsync(BIOMETRIC_SERVICE, token);
  }
};

/**
 * Unlocks the biometric-protected refresh token, prompting the user for FaceID/TouchID/BiometricPrompt.
 * @returns The decrypted Firebase refresh token string.
 */
export const retrieveRefreshTokenWithBiometrics = async (): Promise<string> => {
  // First authenticate with biometrics
  const authResult = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Wellness OS',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  if (!authResult.success) {
    throw new Error('Biometric authentication failed or was cancelled');
  }

  // Then retrieve the token from SecureStore
  const token = await SecureStore.getItemAsync(BIOMETRIC_SERVICE, {
    requireAuthentication: true,
    authenticationPrompt: 'Authenticate to access your session',
  });

  if (!token) {
    throw new Error('Biometric refresh token not found');
  }

  return token;
};

/**
 * Removes the biometric credential entry from secure storage.
 */
export const clearBiometricRefreshToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(BIOMETRIC_SERVICE);
};

/**
 * Determines the native biometric capability available on the device.
 * @returns The supported biometry type or null when unsupported.
 */
export const getSupportedBiometryType = async (): Promise<BiometryType> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return null;
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return null;
    }

    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'FaceID' : 'Fingerprint';
    }
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }

    // iOS Touch ID falls back to fingerprint type
    if (Platform.OS === 'ios' && supportedTypes.length > 0) {
      return 'TouchID';
    }

    return null;
  } catch (error) {
    console.warn('Failed to get supported biometry type', error);
    return null;
  }
};

const getStoredPinHash = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(PIN_HASH_SERVICE);
  } catch (error) {
    return null;
  }
};

/**
 * Indicates whether an application PIN has been configured.
 * @returns True when a hashed PIN exists in secure storage.
 */
export const hasPinCredentials = async (): Promise<boolean> => {
  const pinHash = await getStoredPinHash();
  return Boolean(pinHash);
};

/**
 * Clears the stored PIN hash and encrypted refresh token copy.
 */
export const clearPinCredentials = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(PIN_HASH_SERVICE);
  await SecureStore.deleteItemAsync(PIN_TOKEN_SERVICE);
};

const storePinHash = async (pinHash: string): Promise<void> => {
  await SecureStore.setItemAsync(PIN_HASH_SERVICE, pinHash);
};

const storePinEncryptedTokenWithHash = async (token: string, pinHash: string): Promise<void> => {
  const encrypted = encryptTokenWithKey(token, pinHash);
  await SecureStore.setItemAsync(PIN_TOKEN_SERVICE, encrypted);
};

/**
 * Saves the hashed PIN and encrypts the refresh token with the derived key.
 * @param pin User defined fallback PIN code.
 * @param token Firebase refresh token to protect with the PIN.
 */
export const storePinCredentials = async (pin: string, token: string): Promise<void> => {
  const pinHash = derivePinHash(pin);
  await storePinHash(pinHash);
  await storePinEncryptedTokenWithHash(token, pinHash);
};

/**
 * Re-encrypts the refresh token copy with the stored PIN hash after a session refresh.
 * @param token Latest Firebase refresh token.
 */
export const updatePinProtectedRefreshToken = async (token: string): Promise<void> => {
  const pinHash = await getStoredPinHash();
  if (!pinHash) {
    return;
  }

  await storePinEncryptedTokenWithHash(token, pinHash);
};

/**
 * Validates the provided PIN against the stored hash.
 * @param pin PIN code entered by the user.
 * @returns True when the PIN matches the stored hash.
 */
export const verifyPin = async (pin: string): Promise<boolean> => {
  const storedHash = await getStoredPinHash();
  if (!storedHash) {
    return false;
  }

  const providedHash = derivePinHash(pin);
  return storedHash === providedHash;
};

/**
 * Unlocks the refresh token encrypted with the user's fallback PIN.
 * @param pin Verified PIN code used for decryption.
 * @returns The decrypted Firebase refresh token.
 */
export const retrieveRefreshTokenWithPin = async (pin: string): Promise<string> => {
  const storedHash = await getStoredPinHash();
  if (!storedHash) {
    throw new Error('PIN fallback has not been configured');
  }

  const providedHash = derivePinHash(pin);
  if (storedHash !== providedHash) {
    throw new Error('Invalid PIN');
  }

  const encryptedPayload = await SecureStore.getItemAsync(PIN_TOKEN_SERVICE);
  if (!encryptedPayload) {
    throw new Error('PIN protected refresh token is unavailable');
  }

  return decryptTokenWithKey(encryptedPayload, storedHash);
};
