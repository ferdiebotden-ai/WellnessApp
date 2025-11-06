import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { analyzeNudgeFeedback } from '../functions/src/analyzeNudgeFeedback';
import { getServiceClient } from '../functions/src/supabaseClient';

jest.mock('../functions/src/supabaseClient', () => ({
  getServiceClient: jest.fn(),
}));

describe('analyzeNudgeFeedback', () => {
  const lastRunIso = '2023-12-31T23:00:00.000Z';
  const runStartedIso = '2024-01-01T00:00:00.000Z';

  const createSupabaseMock = () => {
    const jobStateSelectChain = {
      select: jest.fn(),
      eq: jest.fn(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { last_run_at: lastRunIso }, error: null }),
    };

    jobStateSelectChain.select.mockReturnValue(jobStateSelectChain);
    jobStateSelectChain.eq.mockReturnValue(jobStateSelectChain);

    const jobStateUpsertChain = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };

    const aggregatesResponse = { data: [], error: null };

    const auditQuery = {
      select: jest.fn(),
      not: jest.fn(),
      group: jest.fn(),
      gte: jest.fn(),
      lt: jest.fn(),
      then: (resolve: (value: typeof aggregatesResponse) => void) => resolve(aggregatesResponse),
    };

    auditQuery.select.mockReturnValue(auditQuery);
    auditQuery.not.mockReturnValue(auditQuery);
    auditQuery.group.mockReturnValue(auditQuery);
    auditQuery.gte.mockReturnValue(auditQuery);
    auditQuery.lt.mockReturnValue(auditQuery);

    let jobStateSelectUsed = false;

    const from = jest.fn((table: string) => {
      if (table === 'job_run_state') {
        if (!jobStateSelectUsed) {
          jobStateSelectUsed = true;
          return jobStateSelectChain;
        }
        return jobStateUpsertChain;
      }

      if (table === 'ai_audit_log') {
        return auditQuery;
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    return { from, jobStateSelectChain, jobStateUpsertChain, auditQuery };
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(runStartedIso));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('limits aggregation to the execution window', async () => {
    const supabaseMock = createSupabaseMock();
    (getServiceClient as jest.Mock).mockReturnValue(supabaseMock);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await analyzeNudgeFeedback();

    expect(supabaseMock.auditQuery.gte).toHaveBeenCalledWith('user_action_timestamp', lastRunIso);
    expect(supabaseMock.auditQuery.lt).toHaveBeenCalledWith('user_action_timestamp', runStartedIso);

    expect(supabaseMock.jobStateUpsertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ last_run_at: runStartedIso, updated_at: runStartedIso }),
      { onConflict: 'job_name' },
    );

    expect(logSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
