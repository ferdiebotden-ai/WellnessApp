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

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { createFromNudgeFeedback } from './memory';

/**
 * Firestore trigger that creates a memory when user responds to a nudge.
 * This enables the Memory Layer to learn from user feedback in real-time.
 */
export const onNudgeFeedback = onDocumentUpdated(
  'live_nudges/{userId}/entries/{nudgeId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // Safety check for document data
    if (!before || !after) {
      console.log('[onNudgeFeedback] Missing document data, skipping');
      return;
    }

    // Only trigger on status change from 'pending'
    if (before.status !== 'pending' || after.status === 'pending') {
      return; // No status change or still pending
    }

    const userId = event.params.userId;
    const nudgeId = event.params.nudgeId;
    const newStatus = after.status as string;

    // Map status to feedback type
    const feedbackMap: Record<string, 'completed' | 'dismissed' | 'snoozed'> = {
      'completed': 'completed',
      'done': 'completed',
      'dismissed': 'dismissed',
      'skipped': 'dismissed',
      'snoozed': 'snoozed',
      'postponed': 'snoozed',
    };

    const feedback = feedbackMap[newStatus];
    if (!feedback) {
      console.log(`[onNudgeFeedback] Unknown status '${newStatus}' for nudge ${nudgeId}, skipping`);
      return;
    }

    // Extract protocol_id from the nudge document
    const protocolId = after.protocol_id || 'unknown';
    const moduleId = after.module_id || 'unknown';

    try {
      // Create memory from feedback
      const memory = await createFromNudgeFeedback(
        userId,
        nudgeId,
        protocolId,
        feedback,
        `User ${feedback} nudge for ${moduleId} module at ${new Date().toISOString()}`
      );

      console.log(
        `[onNudgeFeedback] Created memory ${memory.id} for user ${userId}: ` +
        `${feedback} nudge (protocol: ${protocolId})`
      );
    } catch (error) {
      console.error(`[onNudgeFeedback] Failed to create memory for nudge ${nudgeId}:`, error);
      // Don't throw - we don't want to retry failed memory creation
      // The nudge feedback is more important than the memory
    }
  }
);
