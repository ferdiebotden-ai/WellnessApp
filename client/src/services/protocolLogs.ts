import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firebaseAuth, getFirebaseDb } from './firebase';
import analytics from './AnalyticsService';

export interface ProtocolLogPayload {
  protocolId: string;
  moduleId: string;
  enrollmentId?: string;
  source?: 'schedule' | 'manual' | 'nudge';
  loggedAt?: Date;
  metadata?: Record<string, unknown>;
  progressTarget?: number;
  /** User's difficulty rating (1-5), optional */
  difficultyRating?: number;
  /** User's notes about this completion, optional */
  notes?: string;
  /** Session 61: Duration in seconds for time tracking */
  durationSeconds?: number;
}

const LOG_COLLECTION = 'protocol_log_queue';
const DEFAULT_PROGRESS_TARGET = 30;

/**
 * Enqueues a protocol completion log into the local Firestore queue so it can
 * be synchronized once the device reconnects.
 */
export const enqueueProtocolLog = async (payload: ProtocolLogPayload): Promise<string> => {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to log a protocol');
  }

  const {
    protocolId,
    moduleId,
    enrollmentId,
    source = 'manual',
    loggedAt,
    metadata,
    progressTarget,
    difficultyRating,
    notes,
    durationSeconds,
  } = payload;

  if (!protocolId) {
    throw new Error('protocolId is required');
  }

  // moduleId can be null for protocols not assigned to a specific module
  // Use 'general' as fallback to satisfy downstream requirements
  const normalizedModuleId = moduleId || 'general';

  const queueRef = collection(getFirebaseDb(), LOG_COLLECTION, currentUser.uid, 'entries');
  const normalizedMetadata = metadata && typeof metadata === 'object' ? metadata : {};

  const target = typeof progressTarget === 'number' && Number.isFinite(progressTarget) && progressTarget > 0
    ? progressTarget
    : DEFAULT_PROGRESS_TARGET;

  const document = {
    userId: currentUser.uid,
    protocolId,
    moduleId: normalizedModuleId,
    enrollmentId: enrollmentId ?? null,
    source,
    status: 'completed',
    loggedAt: loggedAt ? Timestamp.fromDate(loggedAt) : serverTimestamp(),
    metadata: normalizedMetadata,
    progressTarget: target,
    difficultyRating: difficultyRating ?? null,
    notes: notes ?? null,
    // Session 61: Duration tracking
    durationSeconds: typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds : null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(queueRef, document);
  void analytics.trackProtocolLogged({
    protocolId,
    moduleId,
    source,
  });
  return docRef.id;
};
