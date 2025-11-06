import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from './firebase';

export interface ProtocolLogPayload {
  protocolId: string;
  moduleId: string;
  enrollmentId?: string;
  source?: 'schedule' | 'manual' | 'nudge';
  loggedAt?: Date;
  metadata?: Record<string, unknown>;
  progressTarget?: number;
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

  const { protocolId, moduleId, enrollmentId, source = 'manual', loggedAt, metadata, progressTarget } = payload;

  if (!protocolId || !moduleId) {
    throw new Error('protocolId and moduleId are required');
  }

  const queueRef = collection(firebaseDb, LOG_COLLECTION, currentUser.uid, 'entries');
  const normalizedMetadata = metadata && typeof metadata === 'object' ? metadata : {};

  const target = typeof progressTarget === 'number' && Number.isFinite(progressTarget) && progressTarget > 0
    ? progressTarget
    : DEFAULT_PROGRESS_TARGET;

  const document = {
    userId: currentUser.uid,
    protocolId,
    moduleId,
    enrollmentId: enrollmentId ?? null,
    source,
    status: 'completed',
    loggedAt: loggedAt ? Timestamp.fromDate(loggedAt) : serverTimestamp(),
    metadata: normalizedMetadata,
    progressTarget: target,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(queueRef, document);
  return docRef.id;
};
