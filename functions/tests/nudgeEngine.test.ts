import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { generateAdaptiveNudges } from '../src/nudgeEngine';

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

const mockGetServiceClient = vi.mocked(require('../src/supabaseClient')).getServiceClient as unknown as Mock;
const mockGetFirebaseApp = vi.mocked(require('../src/firebaseAdmin')).getFirebaseApp as unknown as Mock;
const mockGetFirestore = vi.mocked(require('firebase-admin/firestore')).getFirestore as unknown as Mock;
const mockProtocolSearch = vi.mocked(require('../src/protocolSearch'));

const createFirestoreMocks = () => {
  const addMock = vi.fn().mockResolvedValue({ id: 'nudge-1' });
  const entriesCollectionMock = vi.fn().mockReturnValue({ add: addMock });
  const userDocMock = vi.fn().mockReturnValue({ collection: entriesCollectionMock });
  const collectionMock = vi.fn((name: string) => {
    if (name === 'live_nudges') {
      return { doc: userDocMock };
    }
    throw new Error(`Unexpected collection: ${name}`);
  });

  mockGetFirestore.mockReturnValue({ collection: collectionMock });
  mockGetFirebaseApp.mockReturnValue({});

  return { collectionMock, userDocMock, entriesCollectionMock, addMock };
};

describe('generateAdaptiveNudges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('generates nudges for active users', async () => {
    // Mock Supabase responses
    const enrollmentsMock = vi.fn().mockResolvedValue({
      data: [{ id: 'enroll-1', user_id: 'user-1', module_id: 'sleep', last_active_date: '2024-07-20' }],
      error: null,
    });
    
    const profilesMock = vi.fn().mockResolvedValue({
      data: [{ id: 'user-1', display_name: 'Test User', healthMetrics: { sleepQualityTrend: 80 } }],
      error: null,
    });

    const auditInsertMock = vi.fn().mockResolvedValue({ error: null });

    const fromMock = vi.fn((table: string) => {
      if (table === 'module_enrollment') return { select: enrollmentsMock };
      if (table === 'users') return { select: () => ({ in: profilesMock }) };
      if (table === 'ai_audit_log') return { insert: auditInsertMock };
      throw new Error(`Unexpected table: ${table}`);
    });

    mockGetServiceClient.mockReturnValue({ from: fromMock });

    // Mock Protocol Search (RAG)
    mockProtocolSearch.generateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockProtocolSearch.resolvePineconeHost.mockResolvedValue('https://pinecone');
    mockProtocolSearch.queryPinecone.mockResolvedValue([{ id: 'proto-1', score: 0.9 }]);
    mockProtocolSearch.fetchProtocols.mockResolvedValue([{ id: 'proto-1', name: 'Protocol 1', benefits: 'Good', citations: ['ref1'] }]);
    mockProtocolSearch.mapProtocols.mockReturnValue([{ id: 'proto-1', name: 'Protocol 1', benefits: 'Good', citations: ['ref1'], score: 0.9 }]);

    // Mock OpenAI Chat Completion
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Do the thing!' } }]
      })
    } as Response);

    const firestoreMocks = createFirestoreMocks();

    await generateAdaptiveNudges(undefined, undefined);

    // Verify RAG flow
    expect(mockProtocolSearch.generateEmbedding).toHaveBeenCalled();
    expect(mockProtocolSearch.queryPinecone).toHaveBeenCalled();

    // Verify OpenAI call
    expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.any(Object));

    // Verify Firestore write
    expect(firestoreMocks.addMock).toHaveBeenCalledWith(expect.objectContaining({
      nudge_text: 'Do the thing!',
      module_id: 'sleep',
      type: 'proactive_coach'
    }));

    // Verify Audit Log
    expect(auditInsertMock).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      decision_type: 'nudge_generated',
      response: 'Do the thing!'
    }));
  });
});

