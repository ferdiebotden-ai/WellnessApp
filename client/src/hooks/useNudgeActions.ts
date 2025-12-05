/**
 * useNudgeActions Hook
 *
 * React hook for managing nudge actions with optimistic updates.
 * Wraps NudgeActionsService with React state management and
 * automatic queue flushing when network reconnects.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNetworkStateCallback } from './useNetworkState';
import {
  flushQueue,
  getQueueSize,
  updateNudgeStatus,
} from '../services/NudgeActionsService';
import type { DashboardTask } from '../types/dashboard';
import type {
  NudgeActionResult,
  UseNudgeActionsReturn,
} from '../types/nudgeActions';

/** Default snooze duration in minutes */
const DEFAULT_SNOOZE_MINUTES = 30;

interface UseNudgeActionsOptions {
  /** User ID for action tracking */
  userId: string | null;
  /** Callback when an action completes successfully */
  onActionComplete?: (task: DashboardTask, action: 'complete' | 'dismiss' | 'snooze') => void;
  /** Callback when an action fails */
  onActionError?: (task: DashboardTask, error: string) => void;
  /** Callback when actions are queued offline */
  onQueuedOffline?: (count: number) => void;
}

/**
 * Hook for managing nudge actions with optimistic updates.
 *
 * @example
 * const { complete, dismiss, snooze, pendingActions, isSyncing } = useNudgeActions({
 *   userId,
 *   onActionComplete: (task, action) => console.log(`${action}: ${task.title}`),
 * });
 *
 * // In component
 * <Button onPress={() => complete(task)}>Mark Complete</Button>
 */
export function useNudgeActions(options: UseNudgeActionsOptions): UseNudgeActionsReturn {
  const { userId, onActionComplete, onActionError, onQueuedOffline } = options;

  const [pendingActions, setPendingActions] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load initial queue size
  useEffect(() => {
    const loadInitialQueueSize = async () => {
      const size = await getQueueSize();
      if (isMountedRef.current) {
        setPendingActions(size);
      }
    };
    loadInitialQueueSize();
  }, []);

  // Flush queue when network reconnects
  const handleOnline = useCallback(async () => {
    if (!userId || isSyncing) return;

    setIsSyncing(true);
    try {
      const processed = await flushQueue();
      if (isMountedRef.current) {
        const remaining = await getQueueSize();
        setPendingActions(remaining);

        if (processed > 0) {
          console.log(`[useNudgeActions] Synced ${processed} queued actions`);
        }
      }
    } catch (error) {
      console.error('[useNudgeActions] Queue flush failed:', error);
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [userId, isSyncing]);

  // Subscribe to network state changes
  useNetworkStateCallback(handleOnline);

  /**
   * Perform an action on a nudge task.
   */
  const performAction = useCallback(
    async (
      task: DashboardTask,
      action: 'complete' | 'dismiss' | 'snooze',
      snoozeMinutes?: number
    ): Promise<NudgeActionResult> => {
      if (!userId) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      if (!task.documentId || !task.collectionPath) {
        return {
          success: false,
          error: 'Task missing Firestore references',
        };
      }

      try {
        const result = await updateNudgeStatus(task, action, userId, snoozeMinutes);

        if (result.success) {
          if (result.queuedForSync) {
            // Update pending count
            const size = await getQueueSize();
            if (isMountedRef.current) {
              setPendingActions(size);
              onQueuedOffline?.(size);
            }
          } else {
            // Successfully synced
            onActionComplete?.(task, action);
          }
        } else if (result.error) {
          onActionError?.(task, result.error);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onActionError?.(task, errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [userId, onActionComplete, onActionError, onQueuedOffline]
  );

  /**
   * Mark a nudge as completed.
   */
  const complete = useCallback(
    (task: DashboardTask): Promise<NudgeActionResult> => {
      return performAction(task, 'complete');
    },
    [performAction]
  );

  /**
   * Dismiss a nudge.
   */
  const dismiss = useCallback(
    (task: DashboardTask): Promise<NudgeActionResult> => {
      return performAction(task, 'dismiss');
    },
    [performAction]
  );

  /**
   * Snooze a nudge for the specified duration.
   */
  const snooze = useCallback(
    (task: DashboardTask, minutes: number = DEFAULT_SNOOZE_MINUTES): Promise<NudgeActionResult> => {
      return performAction(task, 'snooze', minutes);
    },
    [performAction]
  );

  return {
    complete,
    dismiss,
    snooze,
    pendingActions,
    isSyncing,
  };
}

export default useNudgeActions;
