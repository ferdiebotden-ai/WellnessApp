import { Request, Response } from 'express';
import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import JSZip from 'jszip';
import type { Firestore } from 'firebase-admin/firestore';
import { authenticateRequest } from './users';
import { getConfig, getPrivacyConfig } from './config';
import { getServiceClient, getUserClient } from './supabaseClient';
import { getFirebaseApp } from './firebaseAdmin';

interface PrivacyExportMessage {
  userId: string;
  email?: string | null;
  requestedAt: string;
}

interface PrivacyDeletionMessage {
  userId: string;
  email?: string | null;
  requestedAt: string;
}

let cachedPubSub: PubSub | null = null;
let cachedStorage: Storage | null = null;

const getPubSubClient = (): PubSub => {
  if (!cachedPubSub) {
    cachedPubSub = new PubSub();
  }
  return cachedPubSub;
};

const getStorageClient = (): Storage => {
  if (!cachedStorage) {
    cachedStorage = new Storage();
  }
  return cachedStorage;
};

const parsePubSubPayload = <T>(data: Buffer | string | undefined): T => {
  if (!data) {
    throw new Error('Missing pubsub data payload');
  }

  const buffer = typeof data === 'string' ? Buffer.from(data, 'base64') : data;
  const parsed = JSON.parse(buffer.toString('utf8')) as T;
  return parsed;
};

const buildErrorResponse = (error: unknown): { status: number; message: string } => {
  if (typeof error === 'object' && error !== null) {
    const maybeStatus = (error as { status?: number }).status;
    if (typeof maybeStatus === 'number') {
      return { status: maybeStatus, message: (error as Error).message };
    }
  }

  return { status: 500, message: error instanceof Error ? error.message : 'Unexpected server error' };
};

export const requestUserDataExport = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid, email } = await authenticateRequest(req);
    const config = getConfig();
    const privacyConfig = getPrivacyConfig();
    const message: PrivacyExportMessage = {
      userId: uid,
      email: email ?? null,
      requestedAt: new Date().toISOString(),
    };

    await getPubSubClient().topic(privacyConfig.exportTopic).publishMessage({ json: message });

    res.status(202).json({ accepted: true });
  } catch (error) {
    const { status, message } = buildErrorResponse(error);
    res.status(status).json({ error: message });
  }
};

export const requestUserDeletion = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid, email } = await authenticateRequest(req);
    const config = getConfig();
    const privacyConfig = getPrivacyConfig();
    const message: PrivacyDeletionMessage = {
      userId: uid,
      email: email ?? null,
      requestedAt: new Date().toISOString(),
    };

    await getPubSubClient().topic(privacyConfig.deletionTopic).publishMessage({ json: message });

    res.status(202).json({ accepted: true });
  } catch (error) {
    const { status, message } = buildErrorResponse(error);
    res.status(status).json({ error: message });
  }
};

export const getPrivacyDashboardData = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const supabase = getUserClient(uid);

    const [protocolLogs, aiAudit] = await Promise.all([
      supabase
        .from('protocol_logs')
        .select('id, protocol_id, module_id, status, logged_at, metadata')
        .eq('user_id', uid)
        .order('logged_at', { ascending: false })
        .limit(100),
      supabase
        .from('ai_audit_log')
        .select('id, action, agent, model, summary, created_at, metadata')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (protocolLogs.error) {
      throw protocolLogs.error;
    }

    if (aiAudit.error) {
      throw aiAudit.error;
    }

    const sanitizedProtocolLogs = (protocolLogs.data ?? []).map((entry) => ({
      id: entry.id,
      protocol_id: entry.protocol_id,
      protocolName: null,
      module_id: entry.module_id,
      status: entry.status,
      logged_at: entry.logged_at,
      metadata: entry.metadata ?? null,
    }));

    const sanitizedAuditLog = (aiAudit.data ?? []).map((entry) => ({
      id: entry.id,
      action: entry.action,
      agent: entry.agent,
      model: entry.model,
      summary: entry.summary,
      created_at: entry.created_at,
      metadata: entry.metadata ?? null,
    }));

    res.status(200).json({ protocolLogs: sanitizedProtocolLogs, aiAuditLog: sanitizedAuditLog });
  } catch (error) {
    const { status, message } = buildErrorResponse(error);
    res.status(status).json({ error: message });
  }
};

export const deliverExportEmail = async (recipient: string, downloadUrl: string): Promise<void> => {
  // In production this should send through the transactional email provider configured via Mission 023.
  console.info('Delivering privacy export email', { recipient, downloadUrl });
};

const persistArchiveToStorage = async (userId: string, archive: Buffer): Promise<{ filePath: string; signedUrl: string }> => {
  const config = getConfig();
  const privacyConfig = getPrivacyConfig();
  const storage = getStorageClient();
  const filePath = `exports/${userId}/${Date.now()}-privacy-export.zip`;
  const bucket = storage.bucket(privacyConfig.exportBucket);
  const file = bucket.file(filePath);

  await file.save(archive, {
    resumable: false,
    contentType: 'application/zip',
    metadata: {
      metadata: {
        userId,
      },
    },
  });

  const expires = Date.now() + config.privacyExportUrlTtlHours * 60 * 60 * 1000;
  const [signedUrl] = await file.getSignedUrl({ action: 'read', expires });

  return { filePath, signedUrl };
};

const fetchUserDataset = async (userId: string) => {
  const supabase = getServiceClient();

  const [protocolLogs, aiAudit, wearableArchive] = await Promise.all([
    supabase
      .from('protocol_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false }),
    supabase
      .from('ai_audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('wearable_data_archive')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false }),
  ]);

  if (protocolLogs.error) {
    throw protocolLogs.error;
  }

  if (aiAudit.error) {
    throw aiAudit.error;
  }

  if (wearableArchive.error) {
    throw wearableArchive.error;
  }

  return {
    protocolLogs: protocolLogs.data ?? [],
    aiAuditLog: aiAudit.data ?? [],
    wearableArchive: wearableArchive.data ?? [],
  };
};

type PubSubMessage = {
  message?: {
    data?: string | Buffer;
  };
};

export const handleUserExportJob = async (event: PubSubMessage): Promise<void> => {
  const payload = parsePubSubPayload<PrivacyExportMessage>(event.message?.data);
  const dataset = await fetchUserDataset(payload.userId);

  const archive = new JSZip();
  archive.file('protocol_logs.json', JSON.stringify(dataset.protocolLogs, null, 2));
  archive.file('ai_audit_log.json', JSON.stringify(dataset.aiAuditLog, null, 2));
  archive.file('wearable_archive.json', JSON.stringify(dataset.wearableArchive, null, 2));

  const buffer = await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  const { signedUrl } = await persistArchiveToStorage(payload.userId, buffer);

  if (payload.email) {
    await deliverExportEmail(payload.email, signedUrl);
  }
};

const purgeFirestoreData = async (firestore: Firestore, userId: string): Promise<void> => {
  const logQueueRef = firestore.collection('protocol_log_queue').doc(userId).collection('entries');
  const queueDocuments = await logQueueRef.listDocuments();
  await Promise.all(queueDocuments.map((doc) => doc.delete()));
  await firestore.collection('protocol_log_queue').doc(userId).delete().catch(() => undefined);
  await firestore.collection('users').doc(userId).delete().catch(() => undefined);
};

const purgeSupabaseData = async (userId: string): Promise<void> => {
  const supabase = getServiceClient();
  const deletionTargets: Array<{ table: string; column: string }> = [
    { table: 'ai_audit_log', column: 'user_id' },
    { table: 'protocol_logs', column: 'user_id' },
    { table: 'wearable_data_archive', column: 'user_id' },
    { table: 'module_enrollment', column: 'user_id' },
    { table: 'users', column: 'id' },
  ];

  for (const target of deletionTargets) {
    const { error } = await supabase.from(target.table).delete().eq(target.column, userId);
    if (error) {
      throw error;
    }
  }
};

export const handleUserDeletionJob = async (event: PubSubMessage): Promise<void> => {
  const payload = parsePubSubPayload<PrivacyDeletionMessage>(event.message?.data);

  await purgeSupabaseData(payload.userId);

  const firebaseApp = getFirebaseApp();
  const auth = firebaseApp.auth();
  const firestore = firebaseApp.firestore();

  await purgeFirestoreData(firestore, payload.userId);

  try {
    await auth.deleteUser(payload.userId);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'auth/user-not-found'
    ) {
      // User already removed; ignore.
    } else {
      throw error;
    }
  }
};

export { getPubSubClient, getStorageClient, parsePubSubPayload };
export type { PubSubMessage };
