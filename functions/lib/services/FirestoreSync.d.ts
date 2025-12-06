/**
 * FirestoreSync Service
 *
 * Syncs today's metrics from Supabase to Firestore for real-time dashboard updates.
 * Called after HealthKit background delivery processes metrics.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */
import type { DailyMetricsRow } from '../types/wearable.types';
import type { RecoveryResult, UserBaseline } from '../types/recovery.types';
/**
 * Sync today's metrics to Firestore.
 *
 * Creates or updates the todayMetrics/{userId} document with the latest
 * health data. Uses merge: true to preserve fields not included in this update.
 *
 * @param userId - User ID (Firestore document ID)
 * @param date - Date string (YYYY-MM-DD)
 * @param dailyMetrics - Daily metrics from Supabase
 * @param recoveryResult - Recovery calculation result (can be null)
 * @param baseline - User's baseline (can be null)
 */
export declare function syncTodayMetrics(userId: string, date: string, dailyMetrics: DailyMetricsRow, recoveryResult: RecoveryResult | null, baseline: UserBaseline | null): Promise<void>;
/**
 * Update only the recovery portion of today's metrics.
 * Useful when recovery is calculated separately from metrics sync.
 */
export declare function syncRecoveryOnly(userId: string, date: string, recoveryResult: RecoveryResult): Promise<void>;
/**
 * Delete today's metrics document (for testing/cleanup).
 */
export declare function deleteTodayMetrics(userId: string): Promise<void>;
