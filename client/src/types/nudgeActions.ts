/**
 * Nudge Actions Types
 *
 * Types for nudge interaction sync (complete, dismiss, snooze).
 * Used by NudgeActionsService and useNudgeActions hook.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */

import type { DashboardTask } from './dashboard';

/**
 * Possible status values for a nudge in Firestore.
 * Maps to onNudgeFeedback trigger expectations.
 */
export type NudgeStatus = 'pending' | 'completed' | 'dismissed' | 'snoozed';

/**
 * Action types users can perform on nudges.
 */
export type NudgeActionType = 'complete' | 'dismiss' | 'snooze';

/**
 * Maps action types to their resulting status.
 */
export const ACTION_TO_STATUS: Record<NudgeActionType, NudgeStatus> = {
  complete: 'completed',
  dismiss: 'dismissed',
  snooze: 'snoozed',
};

/**
 * Queued action for offline sync.
 * Stored in AsyncStorage when offline.
 */
export interface QueuedNudgeAction {
  /** Unique ID for this queued action */
  id: string;
  /** Firestore document ID of the nudge */
  nudgeId: string;
  /** Full Firestore collection path (e.g., "live_nudges/{userId}/entries") */
  collectionPath: string;
  /** Action to perform */
  action: NudgeActionType;
  /** ISO timestamp when action was initiated */
  timestamp: string;
  /** Number of sync retry attempts */
  retryCount: number;
  /** User ID for validation */
  userId: string;
}

/**
 * Result of a nudge action attempt.
 */
export interface NudgeActionResult {
  /** Whether the action succeeded (or was queued successfully) */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** True if action was queued for later sync (offline) */
  queuedForSync?: boolean;
}

/**
 * Return type for useNudgeActions hook.
 */
export interface UseNudgeActionsReturn {
  /** Mark a task as completed */
  complete: (task: DashboardTask) => Promise<NudgeActionResult>;
  /** Dismiss a task */
  dismiss: (task: DashboardTask) => Promise<NudgeActionResult>;
  /** Snooze a task (default 30 minutes) */
  snooze: (task: DashboardTask, minutes?: number) => Promise<NudgeActionResult>;
  /** Number of actions pending sync */
  pendingActions: number;
  /** Whether currently syncing queued actions */
  isSyncing: boolean;
}

/**
 * Firestore document update payload for nudge status change.
 */
export interface NudgeStatusUpdate {
  status: NudgeStatus;
  updated_at: string;
  updated_by: 'user' | 'system';
  /** For snooze: when to resurface the nudge */
  snooze_until?: string;
}

/**
 * Configuration for the offline queue.
 */
export const QUEUE_CONFIG = {
  /** Maximum number of items in the queue */
  MAX_QUEUE_SIZE: 100,
  /** Maximum retry attempts per action */
  MAX_RETRIES: 3,
  /** AsyncStorage key for the queue */
  STORAGE_KEY: '@apex_nudge_action_queue',
  /** Delay between retry attempts (ms) */
  RETRY_DELAY_MS: 1000,
} as const;
