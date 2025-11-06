import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import * as privacyModule from '../src/privacy';

const {
  requestUserDataExport,
  requestUserDeletion,
  getPrivacyDashboardData,
  handleUserExportJob,
  handleUserDeletionJob,
} = privacyModule;

const authenticateRequestMock = vi.fn();
const getConfigMock = vi.fn();
const publishMessageMock = vi.fn();
const topicMock = vi.fn(() => ({ publishMessage: publishMessageMock }));
const pubsubConstructorMock = vi.fn(() => ({ topic: topicMock }));
const saveMock = vi.fn();
const getSignedUrlMock = vi.fn();
const storageConstructorMock = vi.fn(() => ({
  bucket: vi.fn(() => ({
    file: vi.fn(() => ({
      save: saveMock,
      getSignedUrl: getSignedUrlMock,
    })),
  })),
}));
const getUserClientMock = vi.fn();
const getServiceClientMock = vi.fn();
const getFirebaseAppMock = vi.fn();

vi.mock('../src/users', () => ({
  authenticateRequest: authenticateRequestMock,
}));

vi.mock('../src/config', () => ({
  getConfig: getConfigMock,
}));

vi.mock('@google-cloud/pubsub', () => ({
  PubSub: class {
    constructor(...args: unknown[]) {
      pubsubConstructorMock(...args);
      return { topic: topicMock } as unknown as InstanceType<typeof import('@google-cloud/pubsub').PubSub>;
    }
  },
}));

vi.mock('@google-cloud/storage', () => ({
  Storage: class {
    constructor(...args: unknown[]) {
      storageConstructorMock(...args);
      return {
        bucket: vi.fn(() => ({
          file: vi.fn(() => ({
            save: saveMock,
            getSignedUrl: getSignedUrlMock,
          })),
        })),
      } as unknown as InstanceType<typeof import('@google-cloud/storage').Storage>;
    }
  },
}));

vi.mock('../src/supabaseClient', () => ({
  getUserClient: getUserClientMock,
  getServiceClient: getServiceClientMock,
}));

vi.mock('../src/firebaseAdmin', () => ({
  getFirebaseApp: getFirebaseAppMock,
}));

type MockResponse = Response & {
  statusCode?: number;
  body?: unknown;
};

const createMockResponse = (): MockResponse => {
  const res: Partial<MockResponse> = {};
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  });
  res.json = vi.fn((payload: unknown) => {
    res.body = payload;
    return res as Response;
  });
  return res as MockResponse;
};

const baseConfig = {
  firebaseProjectId: 'project',
  firebaseClientEmail: 'client@example.com',
  firebasePrivateKey: 'key',
  supabaseUrl: 'https://supabase.local',
  supabaseAnonKey: 'anon',
  supabaseServiceRoleKey: 'service',
  supabaseJwtSecret: 'secret',
  defaultTrialDays: 14,
  openAiApiKey: 'openai',
  pineconeApiKey: 'pinecone',
  pineconeIndexName: 'index',
  privacyExportTopic: 'projects/test/topics/privacy-export',
  privacyDeletionTopic: 'projects/test/topics/privacy-delete',
  privacyExportBucket: 'privacy-bucket',
  privacyExportUrlTtlHours: 48,
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  getConfigMock.mockReturnValue(baseConfig);
});

describe('requestUserDataExport', () => {
  it('rejects unsupported methods', async () => {
    const req = { method: 'GET' } as unknown as Request;
    const res = createMockResponse();

    await requestUserDataExport(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('publishes an export job for the authenticated user', async () => {
    authenticateRequestMock.mockResolvedValue({ uid: 'user-123', email: 'user@example.com' });
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
    } as unknown as Request;
    const res = createMockResponse();

    await requestUserDataExport(req, res);

    expect(topicMock).toHaveBeenCalledWith(baseConfig.privacyExportTopic);
    expect(publishMessageMock).toHaveBeenCalledWith({
      json: expect.objectContaining({ userId: 'user-123', email: 'user@example.com' }),
    });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.body).toEqual({ accepted: true });
  });
});

describe('requestUserDeletion', () => {
  it('publishes a deletion job', async () => {
    authenticateRequestMock.mockResolvedValue({ uid: 'user-xyz', email: 'privacy@example.com' });
    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
    } as unknown as Request;
    const res = createMockResponse();

    await requestUserDeletion(req, res);

    expect(topicMock).toHaveBeenCalledWith(baseConfig.privacyDeletionTopic);
    expect(publishMessageMock).toHaveBeenCalledWith({
      json: expect.objectContaining({ userId: 'user-xyz' }),
    });
    expect(res.statusCode).toBe(202);
  });
});

describe('getPrivacyDashboardData', () => {
  it('returns protocol and audit logs for the user', async () => {
    authenticateRequestMock.mockResolvedValue({ uid: 'user-privacy' });
    const protocolLimitMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'log-1',
          protocol_id: 'sleep',
          module_id: 'module-1',
          status: 'completed',
          logged_at: '2024-05-01T00:00:00Z',
          metadata: { note: 'Completed before bedtime' },
        },
      ],
      error: null,
    });
    const protocolOrderMock = vi.fn().mockReturnValue({ limit: protocolLimitMock });
    const protocolEqMock = vi.fn().mockReturnValue({ order: protocolOrderMock });
    const protocolSelectMock = vi.fn().mockReturnValue({ eq: protocolEqMock });

    const auditLimitMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'audit-1',
          action: 'coach_response',
          agent: 'wellness-ai',
          summary: 'Provided sleep hygiene tips',
          created_at: '2024-05-02T00:00:00Z',
          metadata: { promptTokens: 120 },
        },
      ],
      error: null,
    });
    const auditOrderMock = vi.fn().mockReturnValue({ limit: auditLimitMock });
    const auditEqMock = vi.fn().mockReturnValue({ order: auditOrderMock });
    const auditSelectMock = vi.fn().mockReturnValue({ eq: auditEqMock });

    const fromMock = vi
      .fn()
      .mockImplementationOnce(() => ({ select: protocolSelectMock }))
      .mockImplementationOnce(() => ({ select: auditSelectMock }));

    getUserClientMock.mockReturnValue({ from: fromMock } as unknown as SupabaseClient);

    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer token' },
    } as unknown as Request;
    const res = createMockResponse();

    await getPrivacyDashboardData(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      protocolLogs: [
        expect.objectContaining({ id: 'log-1', protocol_id: 'sleep' }),
      ],
      aiAuditLog: [
        expect.objectContaining({ id: 'audit-1', action: 'coach_response' }),
      ],
    });
  });
});

describe('handleUserExportJob', () => {
  it('persists an archive and delivers an email when the user has an email address', async () => {
    const protocolSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [{ id: 'p1' }], error: null }) }),
    });
    const auditSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [{ id: 'a1' }], error: null }) }),
    });
    const wearableSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [{ id: 'w1' }], error: null }) }),
    });

    const fromMock = vi.fn((table: string) => {
      switch (table) {
        case 'protocol_logs':
          return { select: protocolSelectMock };
        case 'ai_audit_log':
          return { select: auditSelectMock };
        case 'wearable_data_archive':
          return { select: wearableSelectMock };
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    getServiceClientMock.mockReturnValue({ from: fromMock } as unknown as SupabaseClient);
    getSignedUrlMock.mockResolvedValue(['https://signed.example.com']);
    const emailSpy = vi.spyOn(privacyModule, 'deliverExportEmail').mockResolvedValue();

    await handleUserExportJob({
      message: {
        data: Buffer.from(JSON.stringify({ userId: 'user-123', email: 'user@example.com', requestedAt: '2024-05-05T00:00:00Z' })).toString(
          'base64'
        ),
      },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(getSignedUrlMock).toHaveBeenCalled();
    expect(emailSpy).toHaveBeenCalledWith('user@example.com', expect.stringContaining('https://signed'));
  });
});

describe('handleUserDeletionJob', () => {
  it('purges Supabase, Firestore, and Firebase Auth records', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn(() => ({ delete: deleteMock }));
    getServiceClientMock.mockReturnValue({ from: fromMock } as unknown as SupabaseClient);

    const queueEntryDeleteMock = vi.fn().mockResolvedValue(undefined);
    const queueDocMock = {
      collection: vi.fn(() => ({
        listDocuments: vi.fn().mockResolvedValue([{ delete: queueEntryDeleteMock }]),
      })),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const usersDocDeleteMock = vi.fn().mockResolvedValue(undefined);

    const firestoreMock = {
      collection: vi.fn((name: string) => {
        if (name === 'protocol_log_queue') {
          return {
            doc: vi.fn(() => queueDocMock),
          };
        }

        if (name === 'users') {
          return {
            doc: vi.fn(() => ({ delete: usersDocDeleteMock })),
          };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    } as unknown as FirebaseFirestore.Firestore;

    const deleteUserMock = vi.fn().mockResolvedValue(undefined);
    getFirebaseAppMock.mockReturnValue({
      auth: () => ({ deleteUser: deleteUserMock }),
      firestore: () => firestoreMock,
    });

    await handleUserDeletionJob({
      message: {
        data: Buffer.from(JSON.stringify({ userId: 'user-erase', requestedAt: '2024-05-05T00:00:00Z' })).toString('base64'),
      },
    });

    expect(fromMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledTimes(5);
    expect(queueEntryDeleteMock).toHaveBeenCalled();
    expect(deleteUserMock).toHaveBeenCalledWith('user-erase');
    expect(usersDocDeleteMock).toHaveBeenCalled();
  });
});
