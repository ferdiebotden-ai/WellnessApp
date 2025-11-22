type ScheduledEvent = {
    data?: string;
} | undefined;
type ScheduledContext = {
    timestamp?: string;
} | undefined;
export declare const generateAdaptiveNudges: (_event: ScheduledEvent, _context: ScheduledContext) => Promise<void>;
export {};
