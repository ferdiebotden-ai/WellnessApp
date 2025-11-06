import { firebaseAuth } from './firebase';
import {
  storeBiometricRefreshToken,
  updatePinProtectedRefreshToken,
} from './secureCredentials';

interface RefreshTokenResponse {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
}

export interface SessionRefreshResult {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Exchanges a Firebase refresh token for a new ID token and refresh token pair.
 * The updated credentials are written back to Firebase auth and persisted in the
 * platform secure storage providers (Keychain/Keystore) for future unlocks.
 *
 * @param refreshToken Refresh token retrieved from the secure credential store.
 * @returns The refreshed Firebase credential payload.
 */
export const refreshFirebaseSession = async (
  refreshToken: string
): Promise<SessionRefreshResult> => {
  if (!refreshToken) {
    throw new Error('Missing refresh token for session refresh');
  }

  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key';
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Firebase session');
  }

  const payload = (await response.json()) as RefreshTokenResponse;

  const authUser = firebaseAuth.currentUser;
  if (!authUser) {
    throw new Error('No authenticated Firebase user available for refresh');
  }

  const tokenManager = (authUser as unknown as { stsTokenManager?: { refreshToken: string; accessToken: string; expirationTime: number } })
    .stsTokenManager;

  const expiresIn = Number(payload.expires_in);

  if (tokenManager) {
    tokenManager.refreshToken = payload.refresh_token;
    tokenManager.accessToken = payload.id_token;
    tokenManager.expirationTime = Date.now() + expiresIn * 1000;
  } else {
    (authUser as unknown as { stsTokenManager: { refreshToken: string; accessToken: string; expirationTime: number } }).stsTokenManager = {
      refreshToken: payload.refresh_token,
      accessToken: payload.id_token,
      expirationTime: Date.now() + expiresIn * 1000,
    };
  }

  await storeBiometricRefreshToken(payload.refresh_token);
  await updatePinProtectedRefreshToken(payload.refresh_token);
  await authUser.getIdToken(true);

  return {
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
    expiresIn,
  };
};
