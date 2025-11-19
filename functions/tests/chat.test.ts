import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { postChat } from '../src/chat';
import type { Request, Response } from 'express';

vi.mock('../src/users', () => ({
  authenticateRequest: vi.fn(),
}));

vi.mock('../src/supabaseClient', () => ({
  getServiceClient: vi.fn(),
}));

vi.mock('../src/firebaseAdmin', () => ({
  getFirebaseApp: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}));

vi.mock('../src/protocolSearch', () => ({
  generateEmbedding: vi.fn(),
  resolvePineconeHost: vi.fn(),
  queryPinecone: vi.fn(),
  fetchProtocols: vi.fn(),
  mapProtocols: vi.fn(),
}));

const mockAuthenticateRequest = vi.mocked(require('../src/users')).authenticateRequest as unknown as Mock;
const mockGetServiceClient = vi.mocked(require('../src/supabaseClient')).getServiceClient as unknown as Mock;
const mockGetFirebaseApp = vi.mocked(require('../src/firebaseAdmin')).getFirebaseApp as unknown as Mock;
const mockGetFirestore = vi.mocked(require('firebase-admin/firestore')).getFirestore as unknown as Mock;
const mockProtocolSearch = vi.mocked(require('../src/protocolSearch'));

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

const createFirestoreMocks = () => {
  const addMock = vi.fn().mockResolvedValue({ id: 'msg-1' });
  const setMock = vi.fn().mockResolvedValue(undefined);
  const messagesCollectionMock = vi.fn().mockReturnValue({ add: addMock });
  const convDocMock = vi.fn().mockReturnValue({ 
    collection: messagesCollectionMock,
    set: setMock
  });
  const convCollectionMock = vi.fn().mockReturnValue({ doc: convDocMock });
  const userDocMock = vi.fn().mockReturnValue({ collection: convCollectionMock });
  const collectionMock = vi.fn((name: string) => {
    if (name === 'users') {
      return { doc: userDocMock };
    }
    throw new Error(`Unexpected collection: ${name}`);
  });

  mockGetFirestore.mockReturnValue({ collection: collectionMock });
  mockGetFirebaseApp.mockReturnValue({});

  return { collectionMock, userDocMock, convCollectionMock, convDocMock, messagesCollectionMock, addMock, setMock };
};

describe('postChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('handles crisis keywords immediately', async () => {
    const req = { method: 'POST', body: { message: 'I want to kill myself' } } as Request;
    const res = createMockResponse();
    mockAuthenticateRequest.mockResolvedValue({ uid: 'user-1' });

    await postChat(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      safety_flag: 'crisis_detected'
    }));
  });

  it('processes valid chat request', async () => {
    const req = { method: 'POST', body: { message: 'How do I sleep better?' } } as Request;
    const res = createMockResponse();
    mockAuthenticateRequest.mockResolvedValue({ uid: 'user-1' });

    // Mock Supabase Profile
    const profileMock = vi.fn().mockResolvedValue({
      data: { display_name: 'Test User', healthMetrics: {} },
      error: null,
    });
    const auditInsertMock = vi.fn().mockResolvedValue({ error: null });

    const fromMock = vi.fn((table: string) => {
      if (table === 'users') return { select: () => ({ eq: () => ({ single: profileMock }) }) };
      if (table === 'ai_audit_log') return { insert: auditInsertMock };
      throw new Error(`Unexpected table: ${table}`);
    });
    mockGetServiceClient.mockReturnValue({ from: fromMock });

    // Mock RAG
    mockProtocolSearch.mapProtocols.mockReturnValue([]);

    // Mock OpenAI
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Sleep in a cold room.' } }]
      })
    } as Response);

    const firestoreMocks = createFirestoreMocks();

    await postChat(req, res);

    // Verify OpenAI call
    expect(fetchMock).toHaveBeenCalled();

    // Verify Firestore persistence
    expect(firestoreMocks.messagesCollectionMock).toHaveBeenCalledTimes(2); // User + Assistant
    expect(firestoreMocks.setMock).toHaveBeenCalled(); // Update conversation metadata

    // Verify Response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      response: 'Sleep in a cold room.'
    }));
  });
});

