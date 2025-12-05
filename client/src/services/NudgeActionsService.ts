/**
 * NudgeActionsService
 *
 * Handles nudge status updates to Firestore with offline queue support.
 * Implements optimistic updates, conflict resolution, and automatic retry.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { firebaseDb, isUsingMemoryPersistenceMode } from './firebase';
import type { DashboardTask } from '../types/dashboard';
import {
  ACTION_TO_STATUS,
  QUEUE_CONFIG,
  type NudgeActionResult,
  type NudgeActionType,
  type NudgeStatus,
  type NudgeStatusUpdate,
  type QueuedNudgeAction,
} from '../types/nudgeActions';

/**
 * Terminal statuses that should not be overwritten.
 * Once a nudge reaches these states, they're considered final.
 */
const TERMINAL_STATUSES: NudgeStatus[] = ['completed', 'dismissed'];

/**
 * Generate unique ID for queued actions.
 */
const generateActionId = (): string =>
  `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

/**
 * Load the offline action queue from AsyncStorage.
 */
export async function loadQueue(): Promise<QueuedNudgeAction[]> {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_CONFIG.STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[NudgeActionsService] Failed to load queue:', error);
    return [];
  }
}

/**
 * Save the offline action queue to AsyncStorage.
 */
export async function saveQueue(queue: QueuedNudgeAction[]): Promise<void> {
  try {
    // Enforce max queue size
    const trimmed = queue.slice(-QUEUE_CONFIG.MAX_QUEUE_SIZE);
    await AsyncStorage.setItem(QUEUE_CONFIG.STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[NudgeActionsService] Failed to save queue:', error);
  }
}

/**
 * Add an action to the offline queue.
 */
export async function queueAction(
  task: DashboardTask,
  action: NudgeActionType,
  userId: string
): Promise<void> {
  if (!task.documentId || !task.collectionPath) {
    console.warn('[NudgeActionsService] Cannot queue action: missing documentId or collectionPath');
    return;
  }

  const queuedAction: QueuedNudgeAction = {
    id: generateActionId(),
    nudgeId: task.documentId,
    collectionPath: task.collectionPath,
    action,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    userId,
  };

  const queue = await loadQueue();

  // Remove any existing action for the same nudge (dedupe)
  const filtered = queue.filter((q) => q.nudgeId !== task.documentId);
  filtered.push(queuedAction);

  await saveQueue(filtered);
  console.log(`[NudgeActionsService] Queued ${action} for nudge ${task.documentId}`);
}

/**
 * Remove an action from the queue by ID.
 */
export async function removeFromQueue(actionId: string): Promise<void> {
  const queue = await loadQueue();
  const filtered = queue.filter((q) => q.id !== actionId);
  await saveQueue(filtered);
}

/**
 * Check if Firestore is available for writes.
 */
export function isFirestoreAvailable(): boolean {
  // Memory persistence mode means Firestore won't persist properly
  if (isUsingMemoryPersistenceMode()) {
    return false;
  }
  return true;
}

/**
 * Check current remote status of a nudge document.
 * Used for conflict resolution.
 */
async function getRemoteStatus(
  collectionPath: string,
  documentId: string
): Promise<{ status: NudgeStatus; updatedAt: Date } | null> {
  try {
    const docRef = doc(firebaseDb, collectionPath, documentId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    const status = data.status as NudgeStatus;
    const updatedAt = data.updated_at instanceof Timestamp
      ? data.updated_at.toDate()
      : new Date(data.updated_at || 0);

    return { status, updatedAt };
  } catch (error) {
    console.error('[NudgeActionsService] Failed to get remote status:', error);
    return null;
  }
}

/**
 * Resolve conflicts between local and remote state.
 * Returns true if local action should proceed, false to skip.
 */
function resolveConflict(
  remoteStatus: NudgeStatus,
  remoteUpdatedAt: Date,
  localAction: NudgeActionType,
  localTimestamp: Date
): boolean {
  // If remote is in terminal state, don't overwrite
  if (TERMINAL_STATUSES.includes(remoteStatus)) {
    console.log(
      `[NudgeActionsService] Conflict: Remote status is terminal (${remoteStatus}), skipping local action`
    );
    return false;
  }

  // Timestamp-based: last write wins
  if (remoteUpdatedAt > localTimestamp) {
    console.log(
      `[NudgeActionsService] Conflict: Remote is newer (${remoteUpdatedAt.toISOString()} > ${localTimestamp.toISOString()}), skipping`
    );
    return false;
  }

  return true;
}

/**
 * Update nudge status in Firestore.
 * Main function for synchronous (online) updates.
 */
export async function updateNudgeStatus(
  task: DashboardTask,
  action: NudgeActionType,
  userId: string,
  snoozeMinutes?: number
): Promise<NudgeActionResult> {
  if (!task.documentId || !task.collectionPath) {
    return {
      success: false,
      error: 'Task missing documentId or collectionPath',
    };
  }

  // Check Firestore availability
  if (!isFirestoreAvailable()) {
    // Queue for later sync
    await queueAction(task, action, userId);
    return {
      success: true,
      queuedForSync: true,
    };
  }

  const timestamp = new Date();
  const newStatus = ACTION_TO_STATUS[action];

  try {
    // Check for conflicts
    const remote = await getRemoteStatus(task.collectionPath, task.documentId);
    if (remote) {
      const shouldProceed = resolveConflict(
        remote.status,
        remote.updatedAt,
        action,
        timestamp
      );
      if (!shouldProceed) {
        return {
          success: false,
          error: `Conflict: nudge already ${remote.status}`,
        };
      }
    }

    // Build update payload
    const update: NudgeStatusUpdate = {
      status: newStatus,
      updated_at: timestamp.toISOString(),
      updated_by: 'user',
    };

    // Add snooze_until for snooze actions
    if (action === 'snooze' && snoozeMinutes) {
      const snoozeUntil = new Date(timestamp.getTime() + snoozeMinutes * 60 * 1000);
      update.snooze_until = snoozeUntil.toISOString();
    }

    // Perform Firestore update
    const docRef = doc(firebaseDb, task.collectionPath, task.documentId);
    await updateDoc(docRef, update as unknown as Record<string, unknown>);

    console.log(
      `[NudgeActionsService] Updated nudge ${task.documentId} to ${newStatus}`
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NudgeActionsService] Update failed:', errorMessage);

    // Network error - queue for later
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('unavailable')
    ) {
      await queueAction(task, action, userId);
      return {
        success: true,
        queuedForSync: true,
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Process a single queued action.
 * Returns true if successfully processed (success or permanent failure).
 */
async function processQueuedAction(
  action: QueuedNudgeAction
): Promise<{ processed: boolean; shouldRemove: boolean }> {
  // Create a minimal task object for updateNudgeStatus
  const task: DashboardTask = {
    id: `${action.collectionPath}:${action.nudgeId}`,
    documentId: action.nudgeId,
    collectionPath: action.collectionPath,
    title: '',
    source: 'nudge',
    status: 'pending',
  };

  const result = await updateNudgeStatus(task, action.action, action.userId);

  if (result.success && !result.queuedForSync) {
    // Successfully synced
    return { processed: true, shouldRemove: true };
  }

  if (result.queuedForSync) {
    // Still offline, keep in queue
    return { processed: false, shouldRemove: false };
  }

  // Error occurred
  if (action.retryCount >= QUEUE_CONFIG.MAX_RETRIES) {
    console.warn(
      `[NudgeActionsService] Max retries reached for action ${action.id}, removing from queue`
    );
    return { processed: false, shouldRemove: true };
  }

  // Increment retry count
  action.retryCount += 1;
  return { processed: false, shouldRemove: false };
}

/**
 * Flush the offline queue.
 * Call this when network connectivity is restored.
 * Returns count of successfully processed actions.
 */
export async function flushQueue(): Promise<number> {
  const queue = await loadQueue();

  if (queue.length === 0) {
    return 0;
  }

  console.log(`[NudgeActionsService] Flushing queue with ${queue.length} actions`);

  let processedCount = 0;
  const toRemove: string[] = [];
  const toKeep: QueuedNudgeAction[] = [];

  for (const action of queue) {
    const { processed, shouldRemove } = await processQueuedAction(action);

    if (processed) {
      processedCount++;
    }

    if (shouldRemove) {
      toRemove.push(action.id);
    } else {
      toKeep.push(action);
    }

    // Small delay between actions to avoid rate limiting
    if (queue.indexOf(action) < queue.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, QUEUE_CONFIG.RETRY_DELAY_MS));
    }
  }

  // Save updated queue
  await saveQueue(toKeep);

  console.log(
    `[NudgeActionsService] Queue flush complete: ${processedCount} processed, ${toKeep.length} remaining`
  );

  return processedCount;
}

/**
 * Get the current queue size.
 */
export async function getQueueSize(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}

/**
 * Clear the entire queue (for debugging/testing).
 */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_CONFIG.STORAGE_KEY);
  console.log('[NudgeActionsService] Queue cleared');
}
