/**
 * Wake Detection Service for Apex OS Phase 3
 *
 * Detects user wake events from multiple sources (HealthKit, phone unlock, manual)
 * and determines if Morning Anchor should be triggered.
 *
 * Detection confidence hierarchy:
 * - HealthKit sleep end: 0.95 (most accurate)
 * - Phone unlock + user confirmed: 0.85 (boosted)
 * - Manual report: 0.70
 * - Phone unlock (unconfirmed): 0.60 (weakest)
 *
 * @file functions/src/services/wake/WakeDetector.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */
import { WakeDetectionMethod, WakeSourceMetrics } from '../../types/wake.types';
/**
 * Input for wake detection analysis.
 */
export interface WakeDetectionInput {
    userId: string;
    source: 'healthkit' | 'phone_unlock' | 'manual';
    timezone: string;
    sleepEndTime?: Date;
    sleepStartTime?: Date;
    phoneUnlockTime?: Date;
    userConfirmedAt?: Date;
    reportedWakeTime?: Date;
}
/**
 * Output from wake detection analysis.
 */
export interface WakeDetectionOutput {
    detected: boolean;
    wakeTime: Date | null;
    method: WakeDetectionMethod | null;
    confidence: number;
    effectiveConfidence: number;
    shouldTriggerMorningAnchor: boolean;
    morningAnchorWindow: {
        start: Date;
        end: Date;
        optimal: Date;
    } | null;
    sourceMetrics: WakeSourceMetrics | null;
    reason: string;
}
export declare class WakeDetector {
    /**
     * Analyze input and detect wake event.
     *
     * @param input - Wake detection input from various sources
     * @returns Detection result with confidence and Morning Anchor timing
     */
    detect(input: WakeDetectionInput): WakeDetectionOutput;
    /**
     * Detect wake from HealthKit sleep data.
     * Uses sleep end time as wake indicator.
     */
    private detectFromHealthKit;
    /**
     * Detect wake from phone unlock (Lite Mode).
     * Lower confidence, can be boosted by user confirmation.
     */
    private detectFromPhoneUnlock;
    /**
     * Detect wake from manual user report.
     */
    private detectFromManual;
    /**
     * Return a no-detection result with reason.
     */
    private noDetection;
    /**
     * Get local hour from Date in given timezone.
     */
    private getLocalHour;
    /**
     * Check if date is a workday (Monday-Friday).
     */
    private isWorkday;
    /**
     * Check if we're within the trigger window for Morning Anchor.
     * Currently always returns true since we trigger on detection.
     * In future, could check if we're within the 5-15 min window.
     */
    private isWithinTriggerWindow;
}
export declare function getWakeDetector(): WakeDetector;
export default WakeDetector;
