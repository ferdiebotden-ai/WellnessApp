"use strict";
/**
 * Push Notification Service
 *
 * Sends push notifications via Expo Push API.
 * Uses ExponentPushToken format for cross-platform delivery (iOS/Android).
 *
 * Reference: https://docs.expo.dev/push-notifications/sending-notifications/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = sendPushNotification;
exports.sendPushToUser = sendPushToUser;
exports.notifySynthesisReady = notifySynthesisReady;
const supabaseClient_1 = require("../supabaseClient");
const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';
/**
 * Send a single push notification via Expo Push API
 *
 * @param expoPushToken - Expo Push Token (ExponentPushToken[xxx])
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional custom data payload
 * @returns Promise<PushResult> with success status and ticket ID
 */
async function sendPushNotification(expoPushToken, title, body, data) {
    // Validate token format
    if (!expoPushToken.startsWith('ExponentPushToken[')) {
        console.warn('[PushService] Invalid token format:', expoPushToken.substring(0, 20));
        return { success: false, error: 'Invalid token format' };
    }
    const message = {
        to: expoPushToken,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
    };
    try {
        const response = await fetch(EXPO_PUSH_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(message),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[PushService] API error:', response.status, errorText);
            return { success: false, error: `API error: ${response.status}` };
        }
        const result = (await response.json());
        const ticket = result.data[0];
        if (ticket.status === 'ok') {
            return { success: true, ticketId: ticket.id };
        }
        else {
            console.warn('[PushService] Push failed:', ticket.message, ticket.details);
            return {
                success: false,
                error: ticket.message,
                errorCode: ticket.details?.error,
            };
        }
    }
    catch (err) {
        console.error('[PushService] Exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}
/**
 * Send push notifications to all active tokens for a user
 *
 * @param userId - User UUID
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional custom data payload
 * @returns Promise with count of successful deliveries
 */
async function sendPushToUser(userId, title, body, data) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Get all active push tokens for user
    const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('expo_push_token')
        .eq('user_id', userId)
        .eq('is_active', true);
    if (error) {
        console.error('[PushService] Failed to fetch tokens:', error);
        return { sent: 0, failed: 0 };
    }
    if (!tokens?.length) {
        console.log(`[PushService] No active tokens for user ${userId}`);
        return { sent: 0, failed: 0 };
    }
    let sent = 0;
    let failed = 0;
    // Send to each token
    for (const { expo_push_token } of tokens) {
        const result = await sendPushNotification(expo_push_token, title, body, data);
        if (result.success) {
            sent++;
        }
        else {
            failed++;
            // Deactivate token if device is not registered
            if (result.errorCode === 'DeviceNotRegistered') {
                console.log('[PushService] Deactivating unregistered token');
                await supabase
                    .from('user_push_tokens')
                    .update({ is_active: false })
                    .eq('expo_push_token', expo_push_token);
            }
        }
    }
    console.log(`[PushService] User ${userId}: ${sent} sent, ${failed} failed`);
    return { sent, failed };
}
/**
 * Send weekly synthesis notification to a user
 *
 * @param userId - User UUID
 * @param synthesisId - ID of the generated synthesis
 * @returns Promise<boolean> indicating if at least one notification was sent
 */
async function notifySynthesisReady(userId, synthesisId) {
    const result = await sendPushToUser(userId, 'Your Weekly Brief is Ready', 'See how your week measured up and what to focus on next.', { type: 'weekly_synthesis', id: synthesisId });
    return result.sent > 0;
}
