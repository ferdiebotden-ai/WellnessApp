"use strict";
/**
 * Protocol Reminder Scheduler
 *
 * Sends push notification reminders for scheduled protocols.
 * Runs every 15 minutes via Pub/Sub trigger, checks for protocols
 * due in the current 15-minute window and sends push notifications.
 *
 * Session 63: Push Notifications & Schedule Reminders
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendScheduledProtocolReminders = void 0;
const supabaseClient_1 = require("./supabaseClient");
const pushService_1 = require("./notifications/pushService");
const suppressionEngine_1 = require("./suppression/suppressionEngine");
/**
 * Resolve the run date from scheduler context
 */
function resolveRunDate(context) {
    if (context?.timestamp) {
        const parsed = new Date(context.timestamp);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    return new Date();
}
/**
 * Parse time string "HH:MM" to total minutes since midnight
 */
function parseTimeToMinutes(timeStr) {
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
}
/**
 * Check if a time is within the current 15-minute window
 */
function isWithinWindow(scheduledMinutes, currentMinutes, windowSizeMinutes = 15) {
    // Handle window that might wrap around midnight
    const windowEnd = currentMinutes + windowSizeMinutes;
    if (windowEnd <= 24 * 60) {
        // No wraparound
        return scheduledMinutes >= currentMinutes && scheduledMinutes < windowEnd;
    }
    else {
        // Wraparound past midnight
        const wrappedEnd = windowEnd - (24 * 60);
        return scheduledMinutes >= currentMinutes || scheduledMinutes < wrappedEnd;
    }
}
/**
 * Check if user is currently in quiet hours
 */
function isInQuietHours(now, prefs) {
    if (!prefs?.quiet_hours_enabled)
        return false;
    const startHour = (0, suppressionEngine_1.parseQuietHour)(prefs.quiet_start_time);
    const endHour = (0, suppressionEngine_1.parseQuietHour)(prefs.quiet_end_time);
    if (startHour === null || startHour === undefined || endHour === null || endHour === undefined) {
        return false;
    }
    const userLocalHour = (0, suppressionEngine_1.getUserLocalHour)(now, prefs.timezone);
    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startHour > endHour) {
        return userLocalHour >= startHour || userLocalHour < endHour;
    }
    return userLocalHour >= startHour && userLocalHour < endHour;
}
/**
 * Send push notification reminders for scheduled protocols.
 * Runs every 15 minutes via Pub/Sub trigger.
 */
const sendScheduledProtocolReminders = async (_event, context) => {
    const runDate = resolveRunDate(context);
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Calculate current time window in UTC minutes
    const currentMinutes = runDate.getUTCHours() * 60 + runDate.getUTCMinutes();
    console.log(`[ProtocolReminder] Running at ${runDate.toISOString()}, UTC minutes: ${currentMinutes}`);
    // Fetch active enrollments with protocol info and user preferences
    const { data: enrollments, error } = await supabase
        .from('user_protocol_enrollment')
        .select(`
      user_id,
      protocol_id,
      default_time_utc,
      protocols!inner(name, short_name),
      users!inner(preferences)
    `)
        .eq('is_active', true);
    if (error) {
        console.error('[ProtocolReminder] Failed to fetch enrollments:', error.message);
        return;
    }
    if (!enrollments || enrollments.length === 0) {
        console.log('[ProtocolReminder] No active enrollments found');
        return;
    }
    let sentCount = 0;
    let skippedQuietHours = 0;
    let skippedNotInWindow = 0;
    for (const enrollment of enrollments) {
        // Parse scheduled time
        const scheduledMinutes = parseTimeToMinutes(enrollment.default_time_utc);
        // Check if protocol is due in current 15-minute window
        if (!isWithinWindow(scheduledMinutes, currentMinutes)) {
            skippedNotInWindow++;
            continue;
        }
        // Check quiet hours
        const userPrefs = enrollment.users?.preferences ?? null;
        if (isInQuietHours(runDate, userPrefs)) {
            skippedQuietHours++;
            console.log(`[ProtocolReminder] Skipped ${enrollment.user_id} - quiet hours`);
            continue;
        }
        // Get protocol name
        const protocolName = enrollment.protocols?.short_name || enrollment.protocols?.name || 'Protocol';
        // Send push notification
        try {
            const result = await (0, pushService_1.sendPushToUser)(enrollment.user_id, `Time for ${protocolName}`, 'Your scheduled protocol is ready. Tap to start.', {
                type: 'protocol_reminder',
                protocol_id: enrollment.protocol_id,
                protocol_name: protocolName
            });
            if (result.sent > 0) {
                sentCount++;
                console.log(`[ProtocolReminder] Sent reminder to ${enrollment.user_id} for ${protocolName}`);
            }
        }
        catch (pushError) {
            console.warn(`[ProtocolReminder] Push failed for ${enrollment.user_id}:`, pushError);
        }
    }
    console.log(`[ProtocolReminder] Complete: sent=${sentCount}, skippedQuiet=${skippedQuietHours}, notInWindow=${skippedNotInWindow}`);
};
exports.sendScheduledProtocolReminders = sendScheduledProtocolReminders;
