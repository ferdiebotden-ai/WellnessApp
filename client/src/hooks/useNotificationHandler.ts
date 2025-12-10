/**
 * useNotificationHandler Hook
 *
 * Handles push notification responses (taps) and navigates to appropriate screens.
 * Supports deep linking to:
 * - Protocol detail screen (for protocol reminders and nudges)
 * - Insights screen (for weekly synthesis)
 *
 * @file client/src/hooks/useNotificationHandler.ts
 */

import { useEffect, useRef } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

/**
 * Notification payload data structure
 */
interface NotificationData {
  type: 'protocol_reminder' | 'nudge' | 'weekly_synthesis';
  protocol_id?: string;
  protocol_name?: string;
  synthesis_id?: string;
}

/**
 * Hook to handle push notification responses and navigate to relevant screens.
 * Call this from a component inside the navigation container (e.g., MainStack).
 */
export function useNotificationHandler(): void {
  const navigation = useNavigation();
  const lastNotificationRef = useRef<string | null>(null);

  useEffect(() => {
    // Handle cold-start notification (app opened via notification tap)
    const checkLastNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          const notificationId = response.notification.request.identifier;
          // Prevent handling the same notification twice
          if (lastNotificationRef.current !== notificationId) {
            lastNotificationRef.current = notificationId;
            handleNotificationResponse(response);
          }
        }
      } catch (error) {
        console.warn('[NotificationHandler] Error checking last notification:', error);
      }
    };

    // Small delay to ensure navigation is ready
    const timeoutId = setTimeout(checkLastNotification, 500);

    // Handle notification tap while app is running (foreground/background)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notificationId = response.notification.request.identifier;
        if (lastNotificationRef.current !== notificationId) {
          lastNotificationRef.current = notificationId;
          handleNotificationResponse(response);
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.remove();
    };
  }, []);

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ): void => {
    const data = response.notification.request.content.data as unknown as NotificationData | undefined;

    if (!data?.type) {
      console.log('[NotificationHandler] No notification type in payload');
      return;
    }

    console.log(`[NotificationHandler] Handling notification type: ${data.type}`);

    switch (data.type) {
      case 'protocol_reminder':
      case 'nudge':
        if (data.protocol_id) {
          // Navigate to Home tab first, then to ProtocolDetail
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'Home' },
                {
                  name: 'Home',
                  state: {
                    routes: [
                      { name: 'HomeMain' },
                      {
                        name: 'ProtocolDetail',
                        params: {
                          protocolId: data.protocol_id,
                          protocolName: data.protocol_name,
                        },
                      },
                    ],
                  },
                },
              ],
            })
          );
          console.log(`[NotificationHandler] Navigating to ProtocolDetail: ${data.protocol_id}`);
        }
        break;

      case 'weekly_synthesis':
        // Navigate to Insights tab
        navigation.dispatch(
          CommonActions.navigate({
            name: 'Insights',
          })
        );
        console.log('[NotificationHandler] Navigating to Insights');
        break;

      default:
        console.log(`[NotificationHandler] Unknown notification type: ${data.type}`);
    }
  };
}
