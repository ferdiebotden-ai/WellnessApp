import { enqueueProtocolLog } from './protocolLogs';

jest.mock('./firebase', () => ({
  firebaseDb: { __type: 'firestore' },
  firebaseAuth: {
    currentUser: { uid: 'user-123' },
  },
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(async () => ({ id: 'doc-abc' })),
  collection: jest.fn(() => ({ __type: 'collection-ref' })),
  serverTimestamp: jest.fn(() => ({ server: 'timestamp' })),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({ from: date.toISOString() })),
  },
}));

const mockFirestore = jest.requireMock('firebase/firestore');
const { firebaseAuth } = jest.requireMock('./firebase');

describe('enqueueProtocolLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firebaseAuth.currentUser = { uid: 'user-123' } as unknown as { uid: string };
  });

  it('writes a protocol log into the Firestore queue with defaults', async () => {
    const id = await enqueueProtocolLog({ protocolId: 'protocol-1', moduleId: 'module-1' });

    expect(id).toBe('doc-abc');
    expect(mockFirestore.collection).toHaveBeenCalledWith({ __type: 'firestore' }, 'protocol_log_queue', 'user-123', 'entries');
    expect(mockFirestore.addDoc).toHaveBeenCalledWith(
      { __type: 'collection-ref' },
      expect.objectContaining({
        userId: 'user-123',
        protocolId: 'protocol-1',
        moduleId: 'module-1',
        progressTarget: 30,
      }),
    );
  });

  it('throws when the user is not authenticated', async () => {
    firebaseAuth.currentUser = null;

    await expect(enqueueProtocolLog({ protocolId: 'p1', moduleId: 'm1' })).rejects.toThrow(
      'User must be authenticated to log a protocol',
    );
  });
});
