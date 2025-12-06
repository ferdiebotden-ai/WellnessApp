"use strict";
/**
 * FirestoreSync Service
 *
 * Syncs today's metrics from Supabase to Firestore for real-time dashboard updates.
 * Called after HealthKit background delivery processes metrics.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTodayMetrics = syncTodayMetrics;
exports.syncRecoveryOnly = syncRecoveryOnly;
exports.deleteTodayMetrics = deleteTodayMetrics;
const firestore_1 = require("firebase-admin/firestore");
const todayMetrics_types_1 = require("../types/todayMetrics.types");
/**
 * Firestore collection for today's metrics.
 */
const COLLECTION_NAME = 'todayMetrics';
/**
 * Get Firestore instance with lazy initialization.
 */
function getDb() {
    return (0, firestore_1.getFirestore)();
}
/**
 * Transform RecoveryResult to TodayMetricsRecovery format.
 */
function transformRecovery(result) {
    if (!result) {
        return null;
    }
    return {
        score: result.score,
        zone: result.zone,
        confidence: result.confidence,
        reasoning: result.reasoning,
        components: {
            hrv: result.components.hrv.score,
            rhr: result.components.rhr.score,
            sleepQuality: result.components.sleepQuality.score,
            sleepDuration: result.components.sleepDuration.score,
        },
    };
}
/**
 * Transform DailyMetricsRow and RecoveryResult to TodayMetricsDocument.
 */
function buildDocument(userId, date, dailyMetrics, recoveryResult, baseline) {
    const now = new Date().toISOString();
    // Calculate vs-baseline strings
    const hrvVsBaseline = baseline
        ? (0, todayMetrics_types_1.formatVsBaseline)(dailyMetrics.hrv_avg, Math.exp(baseline.hrvLnMean), true)
        : null;
    const rhrVsBaseline = baseline
        ? (0, todayMetrics_types_1.formatVsBaseline)(dailyMetrics.rhr_avg, baseline.rhrMean, false)
        : null;
    const doc = {
        date,
        userId,
        lastSyncedAt: now,
        recovery: transformRecovery(recoveryResult),
        sleep: {
            durationHours: dailyMetrics.sleep_duration_hours,
            efficiency: dailyMetrics.sleep_efficiency,
            deepPct: dailyMetrics.deep_percentage,
            remPct: dailyMetrics.rem_percentage,
            bedtimeStart: dailyMetrics.bedtime_start,
            bedtimeEnd: dailyMetrics.bedtime_end,
        },
        hrv: {
            avg: dailyMetrics.hrv_avg,
            method: dailyMetrics.hrv_method,
            vsBaseline: hrvVsBaseline,
        },
        rhr: {
            avg: dailyMetrics.rhr_avg,
            vsBaseline: rhrVsBaseline,
        },
        steps: dailyMetrics.steps,
        activeCalories: dailyMetrics.active_calories,
        dataCompleteness: 0, // Will be calculated
        wearableSource: dailyMetrics.wearable_source,
    };
    // Calculate data completeness
    doc.dataCompleteness = (0, todayMetrics_types_1.calculateDataCompleteness)(doc);
    return doc;
}
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
async function syncTodayMetrics(userId, date, dailyMetrics, recoveryResult, baseline) {
    try {
        const db = getDb();
        const docRef = db.collection(COLLECTION_NAME).doc(userId);
        const document = buildDocument(userId, date, dailyMetrics, recoveryResult, baseline);
        // Use set with merge to preserve any fields we don't update
        await docRef.set(document, { merge: true });
        console.log(`[FirestoreSync] Synced metrics for user ${userId} (date: ${date}, ` +
            `recovery: ${recoveryResult?.score ?? 'N/A'}, completeness: ${Math.round(document.dataCompleteness * 100)}%)`);
    }
    catch (error) {
        // Non-blocking: Firestore sync failure shouldn't break the main flow
        console.error(`[FirestoreSync] Failed to sync metrics for user ${userId}:`, error.message);
        // Don't rethrow - this is a best-effort sync
    }
}
/**
 * Update only the recovery portion of today's metrics.
 * Useful when recovery is calculated separately from metrics sync.
 */
async function syncRecoveryOnly(userId, date, recoveryResult) {
    try {
        const db = getDb();
        const docRef = db.collection(COLLECTION_NAME).doc(userId);
        await docRef.set({
            date,
            userId,
            lastSyncedAt: new Date().toISOString(),
            recovery: transformRecovery(recoveryResult),
        }, { merge: true });
        console.log(`[FirestoreSync] Synced recovery score for user ${userId}: ${recoveryResult.score} (${recoveryResult.zone})`);
    }
    catch (error) {
        console.error(`[FirestoreSync] Failed to sync recovery for user ${userId}:`, error.message);
    }
}
/**
 * Delete today's metrics document (for testing/cleanup).
 */
async function deleteTodayMetrics(userId) {
    try {
        const db = getDb();
        await db.collection(COLLECTION_NAME).doc(userId).delete();
        console.log(`[FirestoreSync] Deleted metrics for user ${userId}`);
    }
    catch (error) {
        console.error(`[FirestoreSync] Failed to delete metrics for user ${userId}:`, error.message);
    }
}
