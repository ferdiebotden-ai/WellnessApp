/**
 * Protocol Reminder Scheduler
 *
 * Sends push notification reminders for scheduled protocols.
 * Runs every 15 minutes via Pub/Sub trigger, checks for protocols
 * due in the current 15-minute window and sends push notifications.
 *
 * Session 63: Push Notifications & Schedule Reminders
 */
type ScheduledEvent = {
    data?: string;
} | undefined;
type ScheduledContext = {
    timestamp?: string;
} | undefined;
/**
 * Send push notification reminders for scheduled protocols.
 * Runs every 15 minutes via Pub/Sub trigger.
 */
export declare const sendScheduledProtocolReminders: (_event: ScheduledEvent, context: ScheduledContext) => Promise<void>;
export {};
