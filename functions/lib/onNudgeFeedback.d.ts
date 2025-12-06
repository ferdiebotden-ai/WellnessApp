/**
 * Firestore Trigger: onNudgeFeedback
 *
 * Fires when a nudge document status changes in Firestore.
 * Creates a memory from the user's feedback (completed, dismissed, snoozed).
 *
 * Path: live_nudges/{userId}/entries/{nudgeId}
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
/**
 * Firestore trigger that creates a memory when user responds to a nudge.
 * This enables the Memory Layer to learn from user feedback in real-time.
 */
export declare const onNudgeFeedback: import("firebase-functions/v2/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    userId: string;
    nudgeId: string;
}>>;
