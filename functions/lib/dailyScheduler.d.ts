type ScheduledEvent = {
    data?: string;
} | undefined;
type ScheduledContext = {
    timestamp?: string;
} | undefined;
/**
 * Generates daily schedules for all active user module enrollments.
 * Runs nightly via Pub/Sub trigger.
 */
export declare const generateDailySchedules: (_event: ScheduledEvent, context: ScheduledContext) => Promise<void>;
export {};
