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
/**
 * Memory Layer Maintenance Job
 *
 * Runs daily to:
 * 1. Apply confidence decay to all memories (PostgreSQL function)
 * 2. Prune expired/low-confidence memories for each user (max 150 per user)
 *
 * Scheduled via Cloud Scheduler (recommended: 4:00 AM UTC daily)
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
export declare const runMemoryMaintenance: (_event: ScheduledEvent, _context: ScheduledContext) => Promise<void>;
export {};
