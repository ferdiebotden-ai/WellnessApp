import { Platform } from 'react-native';

export type BiometryType = 'FaceID' | 'TouchID' | 'Fingerprint' | 'Iris' | null;

const WEB_STORAGE_PREFIX = 'wellness_os_secure_';

/**
 * Persists the Firebase refresh token in SecureStore protected by biometrics.
 * @param token The Firebase refresh token to persist.
 */
export const storeBiometricRefreshToken = async (token: string): Promise<void> => {
  console.log('WEB MOCK: Storing biometric refresh token');
  localStorage.setItem(`${WEB_STORAGE_PREFIX}refresh_token`, token);
};

/**
 * Unlocks the biometric-protected refresh token, prompting the user for FaceID/TouchID/BiometricPrompt.
 * @returns The decrypted Firebase refresh token string.
 */
export const retrieveRefreshTokenWithBiometrics = async (): Promise<string> => {
  console.log('WEB MOCK: Retrieving biometric refresh token');
  const token = localStorage.getItem(`${WEB_STORAGE_PREFIX}refresh_token`);
  if (!token) {
    throw new Error('Biometric refresh token not found');
  }
  return token;
};

/**
 * Removes the biometric credential entry from secure storage.
 */
export const clearBiometricRefreshToken = async (): Promise<void> => {
  console.log('WEB MOCK: Clearing biometric refresh token');
  localStorage.removeItem(`${WEB_STORAGE_PREFIX}refresh_token`);
};

/**
 * Determines the native biometric capability available on the device.
 * @returns The supported biometry type or null when unsupported.
 */
export const getSupportedBiometryType = async (): Promise<BiometryType> => {
  return 'FaceID'; // Mocking FaceID support on web
};

/**
 * Indicates whether an application PIN has been configured.
 * @returns True when a hashed PIN exists in secure storage.
 */
export const hasPinCredentials = async (): Promise<boolean> => {
  return !!localStorage.getItem(`${WEB_STORAGE_PREFIX}pin_hash`);
};

/**
 * Clears the stored PIN hash and encrypted refresh token copy.
 */
export const clearPinCredentials = async (): Promise<void> => {
  localStorage.removeItem(`${WEB_STORAGE_PREFIX}pin_hash`);
  localStorage.removeItem(`${WEB_STORAGE_PREFIX}pin_token`);
};

/**
 * Saves the hashed PIN and encrypts the refresh token with the derived key.
 * @param pin User defined fallback PIN code.
 * @param token Firebase refresh token to protect with the PIN.
 */
export const storePinCredentials = async (pin: string, token: string): Promise<void> => {
  console.log('WEB MOCK: Storing PIN credentials');
  localStorage.setItem(`${WEB_STORAGE_PREFIX}pin_hash`, pin); // Storing plain PIN for mock simplicity
  localStorage.setItem(`${WEB_STORAGE_PREFIX}pin_token`, token);
};

/**
 * Re-encrypts the refresh token copy with the stored PIN hash after a session refresh.
 * @param token Latest Firebase refresh token.
 */
export const updatePinProtectedRefreshToken = async (token: string): Promise<void> => {
  if (localStorage.getItem(`${WEB_STORAGE_PREFIX}pin_hash`)) {
    localStorage.setItem(`${WEB_STORAGE_PREFIX}pin_token`, token);
  }
};

/**
 * Validates the provided PIN against the stored hash.
 * @param pin PIN code entered by the user.
 * @returns True when the PIN matches the stored hash.
 */
export const verifyPin = async (pin: string): Promise<boolean> => {
  const storedPin = localStorage.getItem(`${WEB_STORAGE_PREFIX}pin_hash`);
  return storedPin === pin;
};

/**
 * Unlocks the refresh token encrypted with the user's fallback PIN.
 * @param pin Verified PIN code used for decryption.
 * @returns The decrypted Firebase refresh token.
 */
export const retrieveRefreshTokenWithPin = async (pin: string): Promise<string> => {
  const storedPin = localStorage.getItem(`${WEB_STORAGE_PREFIX}pin_hash`);
  if (storedPin !== pin) {
    throw new Error('Invalid PIN');
  }
  const token = localStorage.getItem(`${WEB_STORAGE_PREFIX}pin_token`);
  if (!token) {
    throw new Error('PIN protected refresh token is unavailable');
  }
  return token;
};

