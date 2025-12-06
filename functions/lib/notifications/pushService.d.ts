/**
 * Push Notification Service
 *
 * Sends push notifications via Expo Push API.
 * Uses ExponentPushToken format for cross-platform delivery (iOS/Android).
 *
 * Reference: https://docs.expo.dev/push-notifications/sending-notifications/
 */
/**
 * Expo Push Message format
 */
export interface ExpoPushMessage {
    /** Expo Push Token (format: ExponentPushToken[xxx]) */
    to: string;
    /** Notification title */
    title: string;
    /** Notification body text */
    body: string;
    /** Custom data payload */
    data?: Record<string, unknown>;
    /** Sound setting */
    sound?: 'default' | null;
    /** Badge count (iOS only) */
    badge?: number;
    /** Time to live in seconds */
    ttl?: number;
    /** Priority: 'default' | 'normal' | 'high' */
    priority?: 'default' | 'normal' | 'high';
    /** Channel ID for Android */
    channelId?: string;
}
/**
 * Result of sending a push notification
 */
export interface PushResult {
    success: boolean;
    ticketId?: string;
    error?: string;
    errorCode?: string;
}
/**
 * Send a single push notification via Expo Push API
 *
 * @param expoPushToken - Expo Push Token (ExponentPushToken[xxx])
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional custom data payload
 * @returns Promise<PushResult> with success status and ticket ID
 */
export declare function sendPushNotification(expoPushToken: string, title: string, body: string, data?: Record<string, unknown>): Promise<PushResult>;
/**
 * Send push notifications to all active tokens for a user
 *
 * @param userId - User UUID
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional custom data payload
 * @returns Promise with count of successful deliveries
 */
export declare function sendPushToUser(userId: string, title: string, body: string, data?: Record<string, unknown>): Promise<{
    sent: number;
    failed: number;
}>;
/**
 * Send weekly synthesis notification to a user
 *
 * @param userId - User UUID
 * @param synthesisId - ID of the generated synthesis
 * @returns Promise<boolean> indicating if at least one notification was sent
 */
export declare function notifySynthesisReady(userId: string, synthesisId: string): Promise<boolean>;
