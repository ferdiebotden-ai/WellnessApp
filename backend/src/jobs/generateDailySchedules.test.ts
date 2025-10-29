import { zonedTimeToUtc } from 'date-fns-tz';
import { generateDailySchedules } from './generateDailySchedules';

jest.mock('../lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getFirestore: jest.fn(),
}));

const mockGetSupabaseClient = jest.requireMock('../lib/supabase').getSupabaseClient as jest.Mock;
const mockGetFirestore = jest.requireMock('../lib/firebase').getFirestore as jest.Mock;

describe('generateDailySchedules', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates timezone-aware schedules and resolves conflicts', async () => {
    const user = {
      id: 'user-1',
      tier: 'core',
      preferences: {
        wake_time: '06:30',
        bedtime: '22:30',
        timezone: 'America/Los_Angeles',
      },
    };

    const usersSelectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [user], error: null }),
    });

    const enrollmentsSelectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: [{ module_id: 'module-1' }],
        error: null,
      }),
    });

    const moduleProtocolSelectMock = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [
          {
            module_id: 'module-1',
            protocol_id: 'protocol-1',
            tier: 'core',
            priority: 10,
            default_offset_minutes: 15,
          },
          {
            module_id: 'module-1',
            protocol_id: 'protocol-2',
            tier: 'core',
            priority: 1,
            default_offset_minutes: 20,
          },
        ],
        error: null,
      }),
    });

    const protocolsSelectMock = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'protocol-1',
            duration_minutes: 20,
            timing_constraints: 'Within 60 min of wake',
          },
          {
            id: 'protocol-2',
            duration_minutes: 10,
            timing_constraints: 'Within 60 min of wake',
          },
        ],
        error: null,
      }),
    });

    const supabaseMock = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'users':
            return { select: usersSelectMock };
          case 'module_enrollment':
            return { select: enrollmentsSelectMock };
          case 'module_protocol_map':
            return { select: moduleProtocolSelectMock };
          case 'protocols':
            return { select: protocolsSelectMock };
          default:
            throw new Error(`Unexpected table ${table}`);
        }
      }),
    };

    mockGetSupabaseClient.mockReturnValue(supabaseMock);

    const scheduleSetMock = jest.fn().mockResolvedValue(undefined);
    const docMock = jest.fn().mockReturnValue({ set: scheduleSetMock });
    const firestoreMock = { doc: docMock };

    mockGetFirestore.mockReturnValue(firestoreMock);

    await generateDailySchedules(undefined, { timestamp: '2024-03-15T00:05:00.000Z' });

    expect(docMock).toHaveBeenCalledWith('schedules/user-1/2024-03-14');
    expect(supabaseMock.from).toHaveBeenCalledWith('users');
    expect(scheduleSetMock).toHaveBeenCalledTimes(1);

    const [[payload]] = scheduleSetMock.mock.calls;
    expect(payload.items).toHaveLength(2);

    const [first, second] = payload.items;

    const expectedFirstTime = zonedTimeToUtc('2024-03-14T06:45:00', 'America/Los_Angeles').toISOString();
    const expectedSecondStart = zonedTimeToUtc('2024-03-14T07:10:00', 'America/Los_Angeles').toISOString();

    expect(first.protocol_id).toBe('protocol-1');
    expect(first.scheduled_time_utc).toBe(expectedFirstTime);
    expect(second.protocol_id).toBe('protocol-2');
    expect(second.scheduled_time_utc).toBe(expectedSecondStart);
  });

  it('writes empty schedule when no enrollments exist', async () => {
    const user = { id: 'user-empty', tier: 'core', preferences: null };

    const usersSelectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [user], error: null }),
    });

    const enrollmentsSelectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const supabaseMock = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'users':
            return { select: usersSelectMock };
          case 'module_enrollment':
            return { select: enrollmentsSelectMock };
          default:
            throw new Error(`Unexpected table ${table}`);
        }
      }),
    };

    mockGetSupabaseClient.mockReturnValue(supabaseMock);

    const scheduleSetMock = jest.fn().mockResolvedValue(undefined);
    const docMock = jest.fn().mockReturnValue({ set: scheduleSetMock });
    const firestoreMock = { doc: docMock };

    mockGetFirestore.mockReturnValue(firestoreMock);

    await generateDailySchedules(undefined, {});

    expect(docMock).toHaveBeenCalledWith(expect.stringMatching(/^schedules\/user-empty\/\d{4}-\d{2}-\d{2}$/));
    expect(scheduleSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [],
      }),
      expect.objectContaining({ merge: true }),
    );
  });
});
