import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { calculateStreaks, resetFreezes } from '../src/streaks';

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
  const entryDocMock = vi.fn().mockReturnValue({ set: setMock });
  const entriesCollectionMock = vi.fn().mockReturnValue({ doc: entryDocMock });
  const userDocMock = vi.fn().mockReturnValue({ collection: entriesCollectionMock });
  const collectionMock = vi.fn((name: string) => {
    if (name === 'live_nudges') {
      return { doc: userDocMock };
    }
    throw new Error(`Unexpected collection: ${name}`);
  });

  mockGetFirestore.mockReturnValue({ collection: collectionMock });
  mockGetFirebaseApp.mockReturnValue({});

  return { collectionMock, userDocMock, entriesCollectionMock, entryDocMock, setMock };
};

describe('streak maintenance functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consumes streak freeze and sends preserved nudge when inactivity exceeds a day', async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'enroll-1',
          user_id: 'user-1',
          module_id: 'sleep',
          current_streak: 5,
          last_active_date: '2024-07-22',
          streak_freeze_available: true,
        },
      ],
      error: null,
    });
    const updateMatchMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ match: updateMatchMock });

    const fromMock = vi.fn((table: string) => {
      if (table === 'module_enrollment') {
        return { select: selectMock, update: updateMock };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    mockGetServiceClient.mockReturnValue({ from: fromMock });

    const firestoreMocks = createFirestoreMocks();

    await calculateStreaks(undefined, { timestamp: '2024-07-24T00:00:00.000Z' });

    expect(selectMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith({
      streak_freeze_available: false,
      streak_freeze_used_date: '2024-07-24T00:00:00.000Z',
    });
    expect(updateMatchMock).toHaveBeenCalledWith({ id: 'enroll-1' });

    expect(firestoreMocks.collectionMock).toHaveBeenCalledWith('live_nudges');
    expect(firestoreMocks.userDocMock).toHaveBeenCalledWith('user-1');
    expect(firestoreMocks.entriesCollectionMock).toHaveBeenCalledWith('entries');
    expect(firestoreMocks.entryDocMock).toHaveBeenCalledWith('enroll-1-2024-07-24T00-00-00-000Z');
    expect(firestoreMocks.setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'streak_preserved',
        source: 'streak_maintenance',
        status: 'pending',
      }),
      { merge: true },
    );

    const [nudgePayload] = firestoreMocks.setMock.mock.calls[0];
    expect(nudgePayload.nudge_text).toContain('5 days');
  });

  it('resets streak and sends lapse recovery nudge when no freeze is available', async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'enroll-2',
          user_id: 'user-2',
          module_id: 'focus',
          current_streak: 4,
          last_active_date: '2024-07-21',
          streak_freeze_available: false,
        },
      ],
      error: null,
    });
    const updateMatchMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ match: updateMatchMock });

    const fromMock = vi.fn((table: string) => {
      if (table === 'module_enrollment') {
        return { select: selectMock, update: updateMock };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    mockGetServiceClient.mockReturnValue({ from: fromMock });

    const firestoreMocks = createFirestoreMocks();

    await calculateStreaks(undefined, { timestamp: '2024-07-24T00:00:00.000Z' });

    expect(updateMock).toHaveBeenCalledWith({ current_streak: 0 });
    expect(updateMatchMock).toHaveBeenCalledWith({ id: 'enroll-2' });

    expect(firestoreMocks.setMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'lapse_recovery' }),
      { merge: true },
    );
  });

  it('does nothing when last activity was within a day', async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'enroll-3',
          user_id: 'user-3',
          module_id: 'resilience',
          current_streak: 2,
          last_active_date: '2024-07-23',
          streak_freeze_available: true,
        },
      ],
      error: null,
    });
    const updateMock = vi.fn();

    const fromMock = vi.fn((table: string) => {
      if (table === 'module_enrollment') {
        return { select: selectMock, update: updateMock };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    mockGetServiceClient.mockReturnValue({ from: fromMock });

    const firestoreMocks = createFirestoreMocks();

    await calculateStreaks(undefined, { timestamp: '2024-07-24T00:00:00.000Z' });

    expect(updateMock).not.toHaveBeenCalled();
    expect(firestoreMocks.setMock).not.toHaveBeenCalled();
  });

  it('resets freezes for all enrollments', async () => {
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn((table: string) => {
      if (table === 'module_enrollment') {
        return { update: updateMock };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    mockGetServiceClient.mockReturnValue({ from: fromMock });

    await resetFreezes(undefined, { timestamp: '2024-07-22T00:00:00.000Z' });

    expect(updateMock).toHaveBeenCalledWith({
      streak_freeze_available: true,
      streak_freeze_used_date: null,
    });
  });
});
