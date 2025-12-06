"use strict";
/**
 * Weekly Synthesis Scheduler
 *
 * Pub/Sub triggered function that generates weekly syntheses for all active users.
 * Runs every Sunday at 8:45am UTC, processes users in their 9am local timezone window.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWeeklySyntheses = generateWeeklySyntheses;
const supabaseClient_1 = require("./supabaseClient");
const suppressionEngine_1 = require("./suppression/suppressionEngine");
const synthesis_1 = require("./synthesis");
const notifications_1 = require("./notifications");
/**
 * Extract a section from the narrative based on keywords.
 * Since we generate flowing prose, we can't easily extract individual sections.
 * Return the full narrative for required fields or empty string for optional.
 */
function extractSection(narrative, section) {
    // For now, return the full narrative for required sections
    // The table has individual columns but we generate flowing prose
    // A future enhancement could use AI to extract sections
    if (section === 'win' || section === 'watch' || section === 'experiment') {
        // These are required columns, use placeholder text from narrative
        return narrative.substring(0, Math.min(500, narrative.length));
    }
    // Optional fields can be null
    return '';
}
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
 * Check if user's local time is within the delivery window (8:45-9:15am)
 */
function isInDeliveryWindow(runDate, timezone) {
    const localHour = (0, suppressionEngine_1.getUserLocalHour)(runDate, timezone);
    const localMinute = runDate.getUTCMinutes(); // Approximate - adjust based on timezone
    // Window: 8:45am to 9:15am local time
    // Since getUserLocalHour only gives hour, we check 8-9am range
    return localHour === 8 || localHour === 9;
}
/**
 * Store synthesis result in Supabase
 */
async function storeSynthesis(supabase, result) {
    const { data, error } = await supabase
        .from('weekly_syntheses')
        .insert({
        user_id: result.user_id,
        week_start: result.week_start,
        week_end: result.week_end,
        narrative: result.narrative,
        // Use metrics_summary to match existing table schema
        metrics_summary: result.metrics_snapshot,
        // Individual section columns (extract from narrative or leave empty for now)
        win_of_week: extractSection(result.narrative, 'win'),
        area_to_watch: extractSection(result.narrative, 'watch'),
        pattern_insight: extractSection(result.narrative, 'pattern'),
        trajectory_prediction: extractSection(result.narrative, 'trajectory'),
        experiment: extractSection(result.narrative, 'experiment'),
        // Additional tracking columns
        word_count: result.word_count,
        sections_detected: result.sections_detected,
        data_days_available: result.metrics_snapshot.data_days_available,
        generated_at: result.generated_at,
        notification_sent: false,
    })
        .select('id')
        .single();
    if (error) {
        // Check if it's a duplicate (UNIQUE constraint violation)
        if (error.code === '23505') {
            console.log(`[WeeklySynthesis] Skipping duplicate for user ${result.user_id}, week ${result.week_start}`);
            return null;
        }
        console.error(`[WeeklySynthesis] Failed to store synthesis:`, error);
        return null;
    }
    return data?.id ?? null;
}
/**
 * Generate weekly syntheses for all active users.
 * Pub/Sub triggered function, runs Sunday 8:45am UTC.
 */
async function generateWeeklySyntheses(_event, context) {
    const runDate = resolveRunDate(context);
    const supabase = (0, supabaseClient_1.getServiceClient)();
    console.log(`[WeeklySynthesis] Starting synthesis generation at ${runDate.toISOString()}`);
    // Calculate previous week's date range (Mon-Sun)
    // If today is Sunday, we're generating for the week that just ended
    const previousSunday = new Date(runDate);
    previousSunday.setDate(previousSunday.getDate() - 7); // Go back one week
    const weekStart = (0, synthesis_1.getWeekMonday)(previousSunday);
    const weekEnd = (0, synthesis_1.getWeekSunday)(previousSunday);
    console.log(`[WeeklySynthesis] Generating for week: ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`);
    // Get all users with recent activity
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, primary_goal, preferences')
        .not('display_name', 'is', null);
    if (usersError) {
        console.error('[WeeklySynthesis] Failed to fetch users:', usersError);
        return;
    }
    if (!users?.length) {
        console.log('[WeeklySynthesis] No users found');
        return;
    }
    // Filter users in delivery window based on their timezone
    const eligibleUsers = users.filter((user) => {
        const timezone = user.preferences?.timezone;
        return isInDeliveryWindow(runDate, timezone);
    });
    console.log(`[WeeklySynthesis] ${eligibleUsers.length}/${users.length} users in delivery window`);
    // Process each eligible user
    let generated = 0;
    let skipped = 0;
    let failed = 0;
    for (const user of eligibleUsers) {
        try {
            // Aggregate metrics for the week
            const metrics = await (0, synthesis_1.aggregateWeeklyMetrics)(user.id, weekStart, weekEnd);
            // Build user context
            const userContext = {
                display_name: user.display_name || 'there',
                primary_goal: user.primary_goal || undefined,
                timezone: user.preferences?.timezone,
            };
            // Generate narrative
            const result = await (0, synthesis_1.generateWeeklyNarrative)(userContext, metrics);
            // Store in database
            const synthesisId = await storeSynthesis(supabase, result);
            if (synthesisId) {
                generated++;
                // Send push notification
                const notified = await (0, notifications_1.notifySynthesisReady)(user.id, synthesisId);
                if (notified) {
                    // Mark as notified in database
                    await supabase
                        .from('weekly_syntheses')
                        .update({ notification_sent: true })
                        .eq('id', synthesisId);
                }
                console.log(`[WeeklySynthesis] Generated for user ${user.id}: ${result.word_count} words, ${result.sections_detected.length}/5 sections`);
            }
            else {
                skipped++;
            }
        }
        catch (err) {
            failed++;
            console.error(`[WeeklySynthesis] Failed for user ${user.id}:`, err);
        }
    }
    console.log(`[WeeklySynthesis] Complete: ${generated} generated, ${skipped} skipped, ${failed} failed`);
}
