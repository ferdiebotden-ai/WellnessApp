"use strict";
/**
 * MVD State Manager
 *
 * Handles Firestore read/write operations for MVD state.
 * State is stored at: user_state/{userId}
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMVDState = getMVDState;
exports.activateMVD = activateMVD;
exports.deactivateMVD = deactivateMVD;
exports.updateMVDCheckTimestamp = updateMVDCheckTimestamp;
exports.initializeMVDState = initializeMVDState;
exports.isMVDActive = isMVDActive;
exports.getMVDHistory = getMVDHistory;
exports.logMVDActivation = logMVDActivation;
exports.closeMVDHistoryRecord = closeMVDHistoryRecord;
const firestore_1 = require("firebase-admin/firestore");
const firebaseAdmin_1 = require("../firebaseAdmin");
const types_1 = require("./types");
/**
 * Firestore collection path for user state
 */
const USER_STATE_COLLECTION = 'user_state';
/**
 * Get the current MVD state for a user
 *
 * @param userId - The user ID
 * @returns MVDState if found, null if no state exists
 */
async function getMVDState(userId) {
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const docRef = firestore.collection(USER_STATE_COLLECTION).doc(userId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        return null;
    }
    const data = docSnap.data();
    if (!data) {
        return null;
    }
    // Extract MVD-related fields, providing defaults for missing fields
    return {
        mvd_active: data.mvd_active ?? false,
        mvd_type: data.mvd_type ?? null,
        trigger: data.trigger ?? null,
        activated_at: data.activated_at ?? null,
        exit_condition: data.exit_condition ?? null,
        last_checked_at: data.last_checked_at ?? new Date().toISOString(),
    };
}
/**
 * Activate MVD mode for a user
 *
 * @param userId - The user ID
 * @param mvdType - Type of MVD to activate
 * @param trigger - What triggered the activation
 * @param exitCondition - Human-readable exit condition
 */
async function activateMVD(userId, mvdType, trigger, exitCondition) {
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const now = new Date().toISOString();
    const docRef = firestore.collection(USER_STATE_COLLECTION).doc(userId);
    await docRef.set({
        mvd_active: true,
        mvd_type: mvdType,
        trigger: trigger,
        activated_at: now,
        exit_condition: exitCondition,
        last_checked_at: now,
    }, { merge: true } // Merge to preserve other user_state fields
    );
}
/**
 * Deactivate MVD mode for a user
 *
 * @param userId - The user ID
 * @param reason - Why MVD was deactivated (for logging)
 */
async function deactivateMVD(userId, reason) {
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const now = new Date().toISOString();
    const docRef = firestore.collection(USER_STATE_COLLECTION).doc(userId);
    await docRef.set({
        mvd_active: false,
        mvd_type: null,
        trigger: null,
        activated_at: null,
        exit_condition: null,
        last_checked_at: now,
        // Optionally store deactivation info for analytics
        last_mvd_deactivation: {
            at: now,
            reason: reason,
        },
    }, { merge: true });
}
/**
 * Update the last_checked_at timestamp without changing MVD state
 *
 * @param userId - The user ID
 */
async function updateMVDCheckTimestamp(userId) {
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const now = new Date().toISOString();
    const docRef = firestore.collection(USER_STATE_COLLECTION).doc(userId);
    await docRef.set({
        last_checked_at: now,
    }, { merge: true });
}
/**
 * Initialize MVD state for a new user (or reset existing)
 *
 * @param userId - The user ID
 */
async function initializeMVDState(userId) {
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const docRef = firestore.collection(USER_STATE_COLLECTION).doc(userId);
    await docRef.set({
        ...types_1.DEFAULT_MVD_STATE,
        last_checked_at: new Date().toISOString(),
    }, { merge: true });
}
/**
 * Check if MVD is currently active for a user
 * Convenience wrapper around getMVDState
 *
 * @param userId - The user ID
 * @returns true if MVD is active, false otherwise
 */
async function isMVDActive(userId) {
    const state = await getMVDState(userId);
    return state?.mvd_active ?? false;
}
/**
 * Get MVD activation history for a user (for analytics)
 * Returns the last N activations from a subcollection
 *
 * @param userId - The user ID
 * @param limit - Number of records to return (default 10)
 */
async function getMVDHistory(userId, limit = 10) {
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const historyRef = firestore
        .collection(USER_STATE_COLLECTION)
        .doc(userId)
        .collection('mvd_history');
    const snapshot = await historyRef
        .orderBy('activated_at', 'desc')
        .limit(limit)
        .get();
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            type: data.type,
            trigger: data.trigger,
            activated_at: data.activated_at,
            deactivated_at: data.deactivated_at ?? null,
            duration_hours: data.duration_hours ?? null,
        };
    });
}
/**
 * Log MVD activation to history subcollection (for analytics)
 *
 * @param userId - The user ID
 * @param mvdType - Type of MVD activated
 * @param trigger - What triggered activation
 */
async function logMVDActivation(userId, mvdType, trigger) {
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const now = new Date().toISOString();
    const historyRef = firestore
        .collection(USER_STATE_COLLECTION)
        .doc(userId)
        .collection('mvd_history');
    const docRef = await historyRef.add({
        type: mvdType,
        trigger: trigger,
        activated_at: now,
        deactivated_at: null,
        duration_hours: null,
    });
    return docRef.id;
}
/**
 * Close an MVD history record when deactivation occurs
 *
 * @param userId - The user ID
 * @param historyId - ID of the history record to close
 */
async function closeMVDHistoryRecord(userId, historyId) {
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const now = new Date();
    const historyRef = firestore
        .collection(USER_STATE_COLLECTION)
        .doc(userId)
        .collection('mvd_history')
        .doc(historyId);
    const doc = await historyRef.get();
    if (!doc.exists)
        return;
    const data = doc.data();
    if (!data?.activated_at)
        return;
    const activatedAt = new Date(data.activated_at);
    const durationMs = now.getTime() - activatedAt.getTime();
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
    await historyRef.update({
        deactivated_at: now.toISOString(),
        duration_hours: durationHours,
    });
}
