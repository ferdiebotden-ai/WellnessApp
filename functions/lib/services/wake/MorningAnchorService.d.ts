/**
 * Morning Anchor Service for Apex OS Phase 3
 *
 * Handles triggering and scheduling of Morning Anchor nudges
 * based on wake detection events.
 *
 * The Morning Anchor is delivered 5-15 minutes post-wake to catch
 * users in the optimal window for morning habit formation.
 *
 * @file functions/src/services/wake/MorningAnchorService.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */
import { WakeEvent, MorningAnchorSkipReason } from '../../types/wake.types';
import { WakeEventRepository } from './WakeEventRepository';
/**
 * Input for triggering Morning Anchor.
 */
export interface MorningAnchorTriggerInput {
    wakeEvent: WakeEvent;
    userId: string;
    recoveryScore?: number;
    timezone?: string;
}
/**
 * Result of Morning Anchor trigger attempt.
 */
export interface MorningAnchorTriggerResult {
    triggered: boolean;
    nudgeId?: string;
    skipped: boolean;
    skipReason?: MorningAnchorSkipReason;
    scheduledFor?: Date;
    error?: string;
}
/**
 * User preferences relevant to Morning Anchor.
 */
interface UserPreferences {
    morningAnchorEnabled: boolean;
    earliestNotificationHour: number;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
}
export declare class MorningAnchorService {
    private wakeRepo;
    private firestore;
    constructor(wakeRepo?: WakeEventRepository);
    /**
     * Trigger Morning Anchor nudge based on wake event.
     *
     * @param input - Trigger input with wake event and context
     * @returns Result indicating success or skip reason
     */
    triggerMorningAnchor(input: MorningAnchorTriggerInput): Promise<MorningAnchorTriggerResult>;
    /**
     * Check if Morning Anchor should be skipped.
     *
     * @param userId - User ID
     * @param wakeEvent - Wake event to check
     * @returns Skip reason or null if should proceed
     */
    checkSkipConditions(userId: string, wakeEvent: WakeEvent): Promise<MorningAnchorSkipReason | null>;
    /**
     * Generate and deliver Morning Anchor nudge.
     *
     * @param userId - User ID
     * @param wakeEvent - Wake event triggering this nudge
     * @param recoveryScore - Optional recovery score for context
     * @param timezone - User's timezone
     */
    private generateMorningAnchorNudge;
    /**
     * Get user preferences for Morning Anchor.
     *
     * @param userId - User ID
     */
    getUserPreferences(userId: string): Promise<UserPreferences>;
}
export declare function getMorningAnchorService(): MorningAnchorService;
export default MorningAnchorService;
