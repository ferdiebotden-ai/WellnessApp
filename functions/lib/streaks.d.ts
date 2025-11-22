interface ModuleEnrollmentRow {
    id: string;
    user_id: string;
    module_id: string;
    current_streak?: number | null;
    last_active_date?: string | null;
    streak_freeze_available?: boolean | null;
}
type ScheduledEvent = {
    data?: string;
} | undefined;
type ScheduledContext = {
    timestamp?: string;
} | undefined;
export declare const calculateStreaks: (_event: ScheduledEvent, context: ScheduledContext) => Promise<void>;
export declare const resetFreezes: (_event: ScheduledEvent, _context: ScheduledContext) => Promise<void>;
export type { ModuleEnrollmentRow };
