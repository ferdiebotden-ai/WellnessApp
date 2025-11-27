import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  onSnapshot,
  orderBy,
  query,
  type FirestoreError,
} from 'firebase/firestore';
import { firebaseDb, isUsingMemoryPersistenceMode } from '../services/firebase';
import type { DashboardTask, TaskSource, TaskStatus } from '../types/dashboard';

interface TaskDocument {
  title?: string;
  status?: TaskStatus;
  scheduled_for?: Timestamp | Date | string | null;
  emphasis?: string;
}

interface UseTaskFeedResult {
  tasks: DashboardTask[];
  loading: boolean;
  error?: string;
}

const SCHEDULE_SUBCOLLECTIONS = ['entries', 'items', 'tasks', 'days'];
const LIVE_NUDGE_SUBCOLLECTIONS = ['entries', 'items', 'nudges'];

const parseScheduledAt = (value?: Timestamp | Date | string | null): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const transformDoc = (id: string, data: TaskDocument, source: TaskSource): DashboardTask => ({
  id,
  title: data.title || 'Untitled task',
  source,
  status: data.status || 'pending',
  scheduledAt: parseScheduledAt(data.scheduled_for),
  emphasis: data.emphasis,
});

export const useTaskFeed = (userId?: string | null): UseTaskFeedResult => {
  const [taskBuckets, setTaskBuckets] = useState<Record<string, DashboardTask[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!userId) {
      setTaskBuckets({});
      setLoading(false);
      return;
    }

    // Short-circuit if Firestore is unavailable (memory-only mode)
    if (isUsingMemoryPersistenceMode()) {
      // Return empty task list - app continues to function
      setTaskBuckets({});
      setLoading(false);
      return;
    }

    const unsubscribeFns: Array<() => void> = [];
    setLoading(true);
    setError(undefined);

    const attachListener = (segments: string[], source: TaskSource) => {
      try {
        const ref = collection(firebaseDb, ...segments);
        const scheduleQuery = query(ref, orderBy('scheduled_for', 'asc'));
        const collectionKey = segments.join('/');
        const unsubscribe = onSnapshot(
          scheduleQuery,
          (snapshot) => {
            setTaskBuckets((previous) => {
              const mapped = snapshot.docs.map((doc) => {
                const baseTask = transformDoc(doc.id, doc.data() as TaskDocument, source);
                return {
                  ...baseTask,
                  id: `${collectionKey}:${doc.id}`,
                  documentId: doc.id,
                  collectionPath: collectionKey,
                };
              });

              if (!mapped.length) {
                const { [collectionKey]: _, ...rest } = previous;
                return rest;
              }

              return {
                ...previous,
                [collectionKey]: mapped,
              };
            });
            setLoading(false);
          },
          (firestoreError: FirestoreError) => {
            // Firestore error - return empty tasks instead of blocking UI
            setError(undefined); // Don't show error to user in dev mode
            setTaskBuckets({});
            setLoading(false);
          }
        );
        unsubscribeFns.push(unsubscribe);
      } catch (listenerError) {
        // Listener setup failed - return empty tasks
        setError(undefined);
        setLoading(false);
      }
    };

    SCHEDULE_SUBCOLLECTIONS.forEach((name) => attachListener(['schedules', userId, name], 'schedule'));
    LIVE_NUDGE_SUBCOLLECTIONS.forEach((name) => attachListener(['live_nudges', userId, name], 'nudge'));

    return () => {
      unsubscribeFns.forEach((unsubscribe) => unsubscribe());
    };
  }, [userId]);

  const orderedTasks = useMemo(() => {
    const flattened = Object.values(taskBuckets).flat();
    return flattened.sort((a, b) => {
      const aTime = a.scheduledAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const bTime = b.scheduledAt?.getTime() ?? Number.POSITIVE_INFINITY;
      if (aTime === bTime) {
        return a.title.localeCompare(b.title);
      }
      return aTime - bTime;
    });
  }, [taskBuckets]);

  return { tasks: orderedTasks, loading, error };
};
