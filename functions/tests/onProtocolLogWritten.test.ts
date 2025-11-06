import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { onProtocolLogWritten } from '../src/onProtocolLogWritten';

vi.mock('../src/supabaseClient', () => ({
  getServiceClient: vi.fn(),
}));

const mockGetServiceClient = vi.mocked(require('../src/supabaseClient')).getServiceClient as unknown as Mock;

describe('onProtocolLogWritten', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists protocol logs, updates streaks, and grants milestone badges', async () => {
    const protocolInsert = vi.fn().mockResolvedValue({ error: null });
    const protocolLogsMatch = vi.fn().mockResolvedValue({ data: Array.from({ length: 7 }, (_, index) => ({ id: `log-${index}` })), error: null });
    const protocolSelect = vi.fn().mockReturnValue({ match: protocolLogsMatch });

    const enrollmentMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'enroll-1',
        current_streak: 6,
        longest_streak: 6,
        last_active_date: '2024-07-20',
      },
      error: null,
    });
    const enrollmentMatch = vi.fn().mockReturnValue({ maybeSingle: enrollmentMaybeSingle });
    const enrollmentSelect = vi.fn().mockReturnValue({ match: enrollmentMatch });
    const enrollmentUpdateMatch = vi.fn().mockResolvedValue({ error: null });
    const enrollmentUpdate = vi.fn().mockReturnValue({ match: enrollmentUpdateMatch });

    const userMaybeSingle = vi.fn().mockResolvedValue({ data: { earnedBadges: ['streak-1'] }, error: null });
    const userEq = vi.fn().mockReturnValue({ maybeSingle: userMaybeSingle });
    const userSelect = vi.fn().mockReturnValue({ eq: userEq });
    const userUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const userUpdate = vi.fn().mockReturnValue({ eq: userUpdateEq });

    const fromMock = vi.fn((table: string) => {
      switch (table) {
        case 'protocol_logs':
          return { insert: protocolInsert, select: protocolSelect };
        case 'module_enrollment':
          return { select: enrollmentSelect, update: enrollmentUpdate };
        case 'users':
          return { select: userSelect, update: userUpdate };
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    });

    mockGetServiceClient.mockReturnValue({ from: fromMock });

    const event = {
      data: {
        value: {
          name: 'projects/demo/databases/(default)/documents/protocol_log_queue/user-1/entries/log-1',
          fields: {
            userId: { stringValue: 'user-1' },
            moduleId: { stringValue: 'module-9' },
            protocolId: { stringValue: 'protocol-5' },
            progressTarget: { integerValue: '30' },
            source: { stringValue: 'schedule' },
            metadata: {
              mapValue: {
                fields: {
                  protocolName: { stringValue: 'Morning Light' },
                },
              },
            },
          },
        },
      },
    } as unknown as Parameters<typeof onProtocolLogWritten>[0];

    await onProtocolLogWritten(event);

    expect(protocolInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user-1',
        module_id: 'module-9',
        protocol_id: 'protocol-5',
        source: 'schedule',
      }),
    ]);
    expect(enrollmentSelect).toHaveBeenCalled();
    expect(enrollmentUpdateMatch).toHaveBeenCalledWith({ id: 'enroll-1' });
    expect(userUpdateEq).toHaveBeenCalledWith('id', 'user-1');
    expect(userUpdate).toHaveBeenCalledWith({ earnedBadges: ['streak-1', 'streak-7'] });
  });

  it('ignores documents without the required identifiers', async () => {
    const fromMock = vi.fn();
    mockGetServiceClient.mockReturnValue({ from: fromMock });

    await onProtocolLogWritten({ data: { value: { fields: {} } } } as unknown as Parameters<typeof onProtocolLogWritten>[0]);

    expect(fromMock).not.toHaveBeenCalled();
  });
});
