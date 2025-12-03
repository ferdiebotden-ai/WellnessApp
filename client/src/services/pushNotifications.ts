/**
 * Push Notifications Service
 *
 * Handles push notification registration and token management using Expo Notifications.
 * Tokens are stored server-side via API for push delivery.
 *
 * Reference: https://docs.expo.dev/push-notifications/push-notifications-setup/
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { firebaseAuth } from './firebase';

/**
 * Configure notification handler behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Get the Expo project ID from app config
 */
function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId;
}

/**
 * Register for push notifications and return the Expo Push Token.
 * Returns null if registration fails or user denies permission.
 *
 * @returns Expo Push Token string or null
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[PushNotifications] Not a physical device, skipping registration');
    return null;
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission not granted');
    return null;
  }

  // Get the Expo Push Token
  const projectId = getProjectId();
  if (!projectId) {
    console.error('[PushNotifications] No projectId found in app config');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[PushNotifications] Token received:', token.data.substring(0, 30) + '...');

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#63E6BE', // Apex OS accent color
      });
    }

    return token.data;
  } catch (error) {
    console.error('[PushNotifications] Failed to get token:', error);
    return null;
  }
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';

/**
 * Save push token to server for push delivery.
 * Creates or updates the token entry via API.
 *
 * @param expoPushToken - The Expo Push Token to save
 * @returns true if saved successfully
 */
export async function savePushToken(expoPushToken: string): Promise<boolean> {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser) {
    console.log('[PushNotifications] No authenticated user');
    return false;
  }

  const deviceType = Platform.OS as 'ios' | 'android' | 'web';

  try {
    const token = await currentUser.getIdToken();

    const response = await fetch(`${API_BASE_URL}/api/push-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        expo_push_token: expoPushToken,
        device_type: deviceType,
      }),
    });

    if (!response.ok) {
      console.error('[PushNotifications] Failed to save token:', response.status);
      return false;
    }

    console.log('[PushNotifications] Token saved successfully');
    return true;
  } catch (error) {
    console.error('[PushNotifications] Failed to save token:', error);
    return false;
  }
}

/**
 * Register for push notifications and save token to server.
 * Call this after user authentication.
 *
 * @returns true if registered and saved successfully
 */
export async function setupPushNotifications(): Promise<boolean> {
  const token = await registerForPushNotifications();

  if (!token) {
    return false;
  }

  return savePushToken(token);
}

/**
 * Deactivate push token on logout or when user revokes permission.
 */
export async function deactivatePushToken(): Promise<void> {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser) return;

  try {
    const token = await currentUser.getIdToken();

    await fetch(`${API_BASE_URL}/api/push-tokens`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('[PushNotifications] Tokens deactivated');
  } catch (error) {
    console.error('[PushNotifications] Failed to deactivate tokens:', error);
  }
}

/**
 * Add a listener for received notifications (foreground).
 *
 * @param callback - Function to call when notification is received
 * @returns Subscription object to remove listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for notification responses (user tapped notification).
 *
 * @param callback - Function to call when user responds to notification
 * @returns Subscription object to remove listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (when app was opened via notification).
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}
