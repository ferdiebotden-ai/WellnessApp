/**
 * Weekly Synthesis Scheduler
 *
 * Pub/Sub triggered function that generates weekly syntheses for all active users.
 * Runs every Sunday at 8:45am UTC, processes users in their 9am local timezone window.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
type ScheduledEvent = {
    data?: string;
} | undefined;
type ScheduledContext = {
    timestamp?: string;
} | undefined;
/**
 * Generate weekly syntheses for all active users.
 * Pub/Sub triggered function, runs Sunday 8:45am UTC.
 */
export declare function generateWeeklySyntheses(_event: ScheduledEvent, context: ScheduledContext): Promise<void>;
export {};
