import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { generateDailySchedules } from '../src/dailyScheduler';

vi.mock('../src/supabaseClient', () => ({
  getServiceClient: vi.fn(),
}));

vi.mock('../src/firebaseAdmin', () => ({
  getFirebaseApp: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}));

const mockGetServiceClient = vi.mocked(require('../src/supabaseClient')).getServiceClient as unknown as Mock;
const mockGetFirebaseApp = vi.mocked(require('../src/firebaseAdmin')).getFirebaseApp as unknown as Mock;
const mockGetFirestore = vi.mocked(require('firebase-admin/firestore')).getFirestore as unknown as Mock;

const createFirestoreMocks = () => {
  const setMock = vi.fn().mockResolvedValue(undefined);
  const commitMock = vi.fn().mockResolvedValue(undefined);
  const batchMock = vi.fn().mockReturnValue({ set: setMock, commit: commitMock });
  
  const docMock = vi.fn().mockReturnValue({});
  const daysCollectionMock = vi.fn().mockReturnValue({ doc: docMock });
  const userDocMock = vi.fn().mockReturnValue({ collection: daysCollectionMock });
  const collectionMock = vi.fn((name: string) => {
    if (name === 'schedules') {
      return { doc: userDocMock };
    }
    throw new Error(`Unexpected collection: ${name}`);
  });

  mockGetFirestore.mockReturnValue({ collection: collectionMock, batch: batchMock });
  mockGetFirebaseApp.mockReturnValue({});

  return { collectionMock, userDocMock, daysCollectionMock, docMock, batchMock, setMock, commitMock };
};

describe('generateDailySchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates schedules for active enrollments', async () => {
    // Mock Supabase responses
    const enrollmentsMock = vi.fn().mockResolvedValue({
      data: [{ id: 'enroll-1', user_id: 'user-1', module_id: 'sleep' }],
      error: null,
    });
    
    const protocolsMock = vi.fn().mockResolvedValue({
      data: [
        { id: 'proto-1', name: 'Morning Light', duration_minutes: 10, category: 'Foundation' },
        { id: 'proto-2', name: 'Evening Wind-Down', duration_minutes: 20, category: 'Recovery' }
      ],
      error: null,
    });

    const mappingsMock = vi.fn().mockResolvedValue({
      data: [
        { protocol_id: 'proto-1', module_id: 'sleep', is_starter_protocol: true },
        { protocol_id: 'proto-2', module_id: 'sleep', is_starter_protocol: true }
      ],
      error: null,
    });

    const fromMock = vi.fn((table: string) => {
      if (table === 'module_enrollment') return { select: enrollmentsMock };
      if (table === 'protocols') return { select: protocolsMock };
      if (table === 'module_protocol_map') return { select: mappingsMock };
      throw new Error(`Unexpected table: ${table}`);
    });

    mockGetServiceClient.mockReturnValue({ from: fromMock });

    const firestoreMocks = createFirestoreMocks();

    await generateDailySchedules(undefined, { timestamp: '2024-07-24T00:00:00.000Z' });

    // Verify Supabase calls
    expect(enrollmentsMock).toHaveBeenCalled();
    expect(protocolsMock).toHaveBeenCalled();
    expect(mappingsMock).toHaveBeenCalled();

    // Verify Firestore writes
    expect(firestoreMocks.batchMock).toHaveBeenCalled();
    expect(firestoreMocks.setMock).toHaveBeenCalledTimes(1); // 1 user
    expect(firestoreMocks.commitMock).toHaveBeenCalled();

    // Verify payload
    const [docRef, payload] = firestoreMocks.setMock.mock.calls[0];
    expect(payload.protocols).toHaveLength(2);
    expect(payload.protocols[0].protocol_id).toBe('proto-1');
    expect(payload.protocols[1].protocol_id).toBe('proto-2');
  });

  it('handles empty enrollments gracefully', async () => {
    const enrollmentsMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const fromMock = vi.fn().mockReturnValue({ select: enrollmentsMock });
    mockGetServiceClient.mockReturnValue({ from: fromMock });

    const firestoreMocks = createFirestoreMocks();

    await generateDailySchedules(undefined, { timestamp: '2024-07-24T00:00:00.000Z' });

    expect(firestoreMocks.batchMock).not.toHaveBeenCalled();
  });
});

