import { deliverFirstWinNudge } from './firstWinNudge';

jest.mock('../lib/firebase', () => ({
  getFirestore: jest.fn(),
}));

jest.mock('../lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetFirestore = jest.requireMock('../lib/firebase').getFirestore as jest.Mock;
const mockGetSupabaseClient = jest.requireMock('../lib/supabase').getSupabaseClient as jest.Mock;

describe('deliverFirstWinNudge', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('selects the most actionable starter protocol for the current period and writes to Firestore', async () => {
    const supabaseMock = { from: jest.fn() };
    mockGetSupabaseClient.mockReturnValue(supabaseMock);

    const moduleMaybeSingleMock = jest.fn().mockResolvedValue({
      data: {
        id: 'focus_foundations',
        name: 'Focus Foundations',
        starter_protocols: ['deep_work', 'brain_dump'],
      },
      error: null,
    });
    const moduleEqMock = jest.fn().mockReturnValue({ maybeSingle: moduleMaybeSingleMock });
    const moduleSelectMock = jest.fn().mockReturnValue({ eq: moduleEqMock });

    const mappingEqSecondMock = jest.fn().mockResolvedValue({
      data: [
        { protocol_id: 'deep_work', module_id: 'focus_foundations', priority: 3, is_starter_protocol: true },
        { protocol_id: 'brain_dump', module_id: 'focus_foundations', priority: 1, is_starter_protocol: true },
      ],
      error: null,
    });
    const mappingEqFirstMock = jest.fn().mockReturnValue({ eq: mappingEqSecondMock });
    const mappingSelectMock = jest.fn().mockReturnValue({ eq: mappingEqFirstMock });

    const protocolsInMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'deep_work',
          name: 'Deep Work Sprint',
          default_time_of_day: '09:00',
          timing_constraints: 'morning focus block',
          priority: 2,
          duration_minutes: 25,
          primary_citation: '10.1234/deepwork',
        },
        {
          id: 'brain_dump',
          name: 'Brain Dump Reset',
          default_time_of_day: '21:00',
          timing_constraints: 'evening wind down',
          priority: 1,
          duration_minutes: 10,
        },
      ],
      error: null,
    });
    const protocolsSelectMock = jest.fn().mockReturnValue({ in: protocolsInMock });

    const userMaybeSingleMock = jest.fn().mockResolvedValue({
      data: { preferences: { timezone: 'America/Los_Angeles' } },
      error: null,
    });
    const userEqMock = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingleMock });
    const userSelectMock = jest.fn().mockReturnValue({ eq: userEqMock });

    supabaseMock.from.mockImplementation((table: string) => {
      switch (table) {
        case 'modules':
          return { select: moduleSelectMock };
        case 'module_protocol_map':
          return { select: mappingSelectMock };
        case 'protocols':
          return { select: protocolsSelectMock };
        case 'users':
          return { select: userSelectMock };
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    const setMock = jest.fn().mockResolvedValue(undefined);
    const entryDocMock = jest.fn(() => ({ set: setMock }));
    const entriesCollectionMock = jest.fn(() => ({ doc: entryDocMock }));
    const userDocMock = jest.fn(() => ({ collection: entriesCollectionMock }));
    const collectionMock = jest.fn(() => ({ doc: userDocMock }));

    mockGetFirestore.mockReturnValue({ collection: collectionMock });

    const now = new Date('2024-07-10T16:05:00.000Z');
    const result = await deliverFirstWinNudge('user-1', 'focus_foundations', { now });

    expect(result).toBe(true);
    expect(collectionMock).toHaveBeenCalledWith('live_nudges');
    expect(userDocMock).toHaveBeenCalledWith('user-1');
    expect(entriesCollectionMock).toHaveBeenCalledWith('entries');

    const payload = setMock.mock.calls[0][0];
    expect(payload.protocol_id).toBe('deep_work');
    expect(payload.priority).toBe('high');
    expect(payload.starter_protocol).toBe(true);
    expect(payload.source).toBe('mission_010_first_win');
    expect(payload.evidence_citation).toBe('10.1234/deepwork');
    expect(payload.status).toBe('pending');
    expect(typeof payload.generated_at).toBe('string');
  });

  it('falls back to module protocol map when the module record has no starter list', async () => {
    const supabaseMock = { from: jest.fn() };
    mockGetSupabaseClient.mockReturnValue(supabaseMock);

    const moduleMaybeSingleMock = jest.fn().mockResolvedValue({
      data: {
        id: 'sleep_reset',
        name: 'Sleep Reset',
        starter_protocols: null,
      },
      error: null,
    });
    const moduleEqMock = jest.fn().mockReturnValue({ maybeSingle: moduleMaybeSingleMock });
    const moduleSelectMock = jest.fn().mockReturnValue({ eq: moduleEqMock });

    const mappingEqSecondMock = jest.fn().mockResolvedValue({
      data: [
        { protocol_id: 'morning_light', module_id: 'sleep_reset', priority: 2, is_starter_protocol: true },
        { protocol_id: 'nsdr_reset', module_id: 'sleep_reset', priority: 1, is_starter_protocol: true },
      ],
      error: null,
    });
    const mappingEqFirstMock = jest.fn().mockReturnValue({ eq: mappingEqSecondMock });
    const mappingSelectMock = jest.fn().mockReturnValue({ eq: mappingEqFirstMock });

    const protocolsInMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'morning_light',
          name: 'Morning Light Exposure',
          default_time_of_day: '07:30',
          timing_constraints: 'morning sunlight',
          priority: 1,
          duration_minutes: 15,
        },
        {
          id: 'nsdr_reset',
          name: 'NSDR Reset',
          default_time_of_day: '21:00',
          timing_constraints: 'evening wind down',
          priority: 1,
          duration_minutes: 20,
        },
      ],
      error: null,
    });
    const protocolsSelectMock = jest.fn().mockReturnValue({ in: protocolsInMock });

    const userMaybeSingleMock = jest.fn().mockResolvedValue({
      data: { preferences: { timezone: 'America/New_York' } },
      error: null,
    });
    const userEqMock = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingleMock });
    const userSelectMock = jest.fn().mockReturnValue({ eq: userEqMock });

    supabaseMock.from.mockImplementation((table: string) => {
      switch (table) {
        case 'modules':
          return { select: moduleSelectMock };
        case 'module_protocol_map':
          return { select: mappingSelectMock };
        case 'protocols':
          return { select: protocolsSelectMock };
        case 'users':
          return { select: userSelectMock };
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    const setMock = jest.fn().mockResolvedValue(undefined);
    const entryDocMock = jest.fn(() => ({ set: setMock }));
    const entriesCollectionMock = jest.fn(() => ({ doc: entryDocMock }));
    const userDocMock = jest.fn(() => ({ collection: entriesCollectionMock }));
    const collectionMock = jest.fn(() => ({ doc: userDocMock }));
    mockGetFirestore.mockReturnValue({ collection: collectionMock });

    const now = new Date('2024-07-10T11:45:00.000Z');
    const result = await deliverFirstWinNudge('user-99', 'sleep_reset', { now });

    expect(result).toBe(true);
    const payload = setMock.mock.calls[0][0];
    expect(payload.protocol_id).toBe('morning_light');
    expect(payload.timing.toLowerCase()).toContain('morning');
  });

  it('returns false and avoids Firestore writes when no starter protocols are available', async () => {
    const supabaseMock = { from: jest.fn() };
    mockGetSupabaseClient.mockReturnValue(supabaseMock);

    const moduleMaybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const moduleEqMock = jest.fn().mockReturnValue({ maybeSingle: moduleMaybeSingleMock });
    const moduleSelectMock = jest.fn().mockReturnValue({ eq: moduleEqMock });

    const mappingEqSecondMock = jest.fn().mockResolvedValue({ data: [], error: null });
    const mappingEqFirstMock = jest.fn().mockReturnValue({ eq: mappingEqSecondMock });
    const mappingSelectMock = jest.fn().mockReturnValue({ eq: mappingEqFirstMock });

    const protocolsInMock = jest.fn().mockResolvedValue({ data: [], error: null });
    const protocolsSelectMock = jest.fn().mockReturnValue({ in: protocolsInMock });

    const userMaybeSingleMock = jest.fn().mockResolvedValue({ data: { preferences: { timezone: null } }, error: null });
    const userEqMock = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingleMock });
    const userSelectMock = jest.fn().mockReturnValue({ eq: userEqMock });

    supabaseMock.from.mockImplementation((table: string) => {
      switch (table) {
        case 'modules':
          return { select: moduleSelectMock };
        case 'module_protocol_map':
          return { select: mappingSelectMock };
        case 'protocols':
          return { select: protocolsSelectMock };
        case 'users':
          return { select: userSelectMock };
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    const setMock = jest.fn();
    const entryDocMock = jest.fn(() => ({ set: setMock }));
    const entriesCollectionMock = jest.fn(() => ({ doc: entryDocMock }));
    const userDocMock = jest.fn(() => ({ collection: entriesCollectionMock }));
    const collectionMock = jest.fn(() => ({ doc: userDocMock }));
    mockGetFirestore.mockReturnValue({ collection: collectionMock });

    const result = await deliverFirstWinNudge('user-empty', 'unknown');

    expect(result).toBe(false);
    expect(setMock).not.toHaveBeenCalled();
  });
});
