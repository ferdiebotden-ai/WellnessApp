import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  syncWearableData,
  normalizeWearableMetrics,
  computeSleepTrend,
  computeHrvImprovement,
} from '../src/wearablesSync';

const verifyFirebaseTokenMock = vi.fn();
const getServiceClientMock = vi.fn();

vi.mock('../src/firebaseAdmin', () => ({
  verifyFirebaseToken: verifyFirebaseTokenMock,
}));

vi.mock('../src/supabaseClient', () => ({
  getServiceClient: getServiceClientMock,
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

describe('normalizeWearableMetrics', () => {
  it('converts SDNN readings into RMSSD and aggregates totals', () => {
    const metrics = [
      { metric: 'sleep', value: 420, source: 'apple_health' },
      { metric: 'sleep', value: 60, source: 'apple_health' },
      { metric: 'hrv', value: 80, source: 'apple_health' },
      { metric: 'hrv', value: 55, source: 'google_fit', metadata: { sdnn: 70 } },
      { metric: 'rhr', value: 50, source: 'apple_health' },
      { metric: 'rhr', value: 55, source: 'apple_health' },
      { metric: 'steps', value: 1200, source: 'apple_health' },
      { metric: 'steps', value: 800, source: 'google_fit' },
    ];

    const normalized = normalizeWearableMetrics(metrics as Parameters<typeof normalizeWearableMetrics>[0]);

    expect(normalized.sleepHours).toBe(8);
    expect(normalized.rmssd).toBe(61.5);
    expect(normalized.sdnn).toBe(75);
    expect(normalized.hrvScore).toBe(42);
    expect(normalized.restingHeartRate).toBe(52.5);
    expect(normalized.steps).toBe(2000);
    expect(normalized.readinessScore).toBe(65);
  });
});

describe('trend calculators', () => {
  it('computes sleep trend over the configured window', () => {
    const rows = [
      { sleep_hours: 6, hrv_score: 60, recorded_at: '2024-05-05T00:00:00Z' },
      { sleep_hours: 7.5, hrv_score: 62, recorded_at: '2024-05-04T00:00:00Z' },
      { sleep_hours: 7, hrv_score: 61, recorded_at: '2024-05-03T00:00:00Z' },
      { sleep_hours: null, hrv_score: null, recorded_at: '2024-05-02T00:00:00Z' },
      { sleep_hours: 6.5, hrv_score: 58, recorded_at: '2024-05-01T00:00:00Z' },
      { sleep_hours: 6.8, hrv_score: 57, recorded_at: '2024-04-30T00:00:00Z' },
      { sleep_hours: 6.9, hrv_score: 56, recorded_at: '2024-04-29T00:00:00Z' },
      { sleep_hours: 6.7, hrv_score: 55, recorded_at: '2024-04-28T00:00:00Z' },
    ];

    expect(computeSleepTrend(rows)).toBe(6.78);
  });

  it('computes HRV improvement relative to baseline history', () => {
    const rows = [
      { sleep_hours: 6, hrv_score: 70, recorded_at: '2024-05-05T00:00:00Z' },
      { sleep_hours: 7, hrv_score: 68, recorded_at: '2024-05-04T00:00:00Z' },
      { sleep_hours: 7, hrv_score: 69, recorded_at: '2024-05-03T00:00:00Z' },
      { sleep_hours: 6.5, hrv_score: 65, recorded_at: '2024-05-02T00:00:00Z' },
      { sleep_hours: 6.4, hrv_score: 64, recorded_at: '2024-05-01T00:00:00Z' },
      { sleep_hours: 6.2, hrv_score: 63, recorded_at: '2024-04-30T00:00:00Z' },
      { sleep_hours: 6.1, hrv_score: 62, recorded_at: '2024-04-29T00:00:00Z' },
      { sleep_hours: 6, hrv_score: 60, recorded_at: '2024-04-28T00:00:00Z' },
    ];

    expect(computeHrvImprovement(rows)).toBeCloseTo(8.33, 2);
  });
});

describe('syncWearableData handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyFirebaseTokenMock.mockReset();
    getServiceClientMock.mockReset();
  });

  it('rejects unsupported HTTP methods', async () => {
    const req = { method: 'GET' } as unknown as Request;
    const res = createMockResponse();

    await syncWearableData(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('requires authentication token', async () => {
    const req = { method: 'POST', headers: {}, body: {} } as unknown as Request;
    const res = createMockResponse();

    await syncWearableData(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: 'Missing bearer token' });
  });

  it('returns 403 when user_id does not match token', async () => {
    verifyFirebaseTokenMock.mockResolvedValue({ uid: 'user-abc' });

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: {
        user_id: 'user-xyz',
        source: 'apple_health',
        captured_at: '2024-05-05T00:00:00Z',
        metrics: [{ metric: 'sleep', value: 120, source: 'apple_health' }],
      },
    } as unknown as Request;

    const res = createMockResponse();

    await syncWearableData(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({ error: 'Authenticated user mismatch' });
  });

  it('persists normalized data and updates health metrics', async () => {
    verifyFirebaseTokenMock.mockResolvedValue({ uid: 'user-123' });

    const archiveInsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const archiveHistoryLimitMock = vi.fn().mockResolvedValue({
      data: [
        { sleep_hours: 6, hrv_score: 59, recorded_at: '2024-05-05T00:00:00Z' },
        { sleep_hours: 7.5, hrv_score: 65, recorded_at: '2024-05-04T00:00:00Z' },
        { sleep_hours: 7, hrv_score: 60, recorded_at: '2024-05-03T00:00:00Z' },
        { sleep_hours: null, hrv_score: null, recorded_at: '2024-05-02T00:00:00Z' },
        { sleep_hours: 6.5, hrv_score: 58, recorded_at: '2024-05-01T00:00:00Z' },
        { sleep_hours: 6.8, hrv_score: 57, recorded_at: '2024-04-30T00:00:00Z' },
        { sleep_hours: 6.9, hrv_score: 56, recorded_at: '2024-04-29T00:00:00Z' },
        { sleep_hours: 6.7, hrv_score: 55, recorded_at: '2024-04-28T00:00:00Z' },
      ],
      error: null,
    });
    const archiveHistoryOrderMock = vi.fn().mockReturnValue({ limit: archiveHistoryLimitMock });
    const archiveHistoryEqMock = vi.fn().mockReturnValue({ order: archiveHistoryOrderMock });
    const archiveHistorySelectMock = vi.fn().mockReturnValue({ eq: archiveHistoryEqMock });

    const userSelectSingleMock = vi.fn().mockResolvedValue({
      data: { healthMetrics: { protocolAdherencePct: 82, moduleProgressPct: { sleep: 40 } } },
      error: null,
    });
    const userSelectEqMock = vi.fn().mockReturnValue({ single: userSelectSingleMock });
    const userSelectMock = vi.fn().mockReturnValue({ eq: userSelectEqMock });

    const userUpdateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const userUpdateMock = vi.fn().mockReturnValue({ eq: userUpdateEqMock });

    const supabaseFromMock = vi.fn()
      .mockImplementationOnce(() => ({ insert: archiveInsertMock }))
      .mockImplementationOnce(() => ({ select: archiveHistorySelectMock }))
      .mockImplementationOnce(() => ({ select: userSelectMock }))
      .mockImplementationOnce(() => ({ update: userUpdateMock }));

    const supabaseClient = { from: supabaseFromMock } as unknown as SupabaseClient;
    getServiceClientMock.mockReturnValue(supabaseClient);

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: {
        user_id: 'user-123',
        source: 'apple_health',
        captured_at: '2024-05-05T07:00:00Z',
        metrics: [
          { metric: 'sleep', value: 360, source: 'apple_health' },
          { metric: 'hrv', value: 82, source: 'apple_health' },
          { metric: 'rhr', value: 52, source: 'apple_health' },
          { metric: 'steps', value: 4000, source: 'apple_health' },
        ],
      },
    } as unknown as Request;

    const res = createMockResponse();

    await syncWearableData(req, res);

    expect(verifyFirebaseTokenMock).toHaveBeenCalledWith('token-123');
    expect(archiveInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        sleep_hours: 6,
        hrv_score: 50,
        hrv_rmssd_ms: 69.7,
        readiness_score: 60,
      }),
    );

    expect(userUpdateMock).toHaveBeenCalledWith({
      healthMetrics: {
        protocolAdherencePct: 82,
        moduleProgressPct: { sleep: 40 },
        sleepQualityTrend: 6.78,
        hrvImprovementPct: 7.58,
      },
    });

    expect(userUpdateEqMock).toHaveBeenCalledWith('id', 'user-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({ success: true });
  });

  it('returns 500 when persistence fails', async () => {
    verifyFirebaseTokenMock.mockResolvedValue({ uid: 'user-123' });

    const archiveInsertMock = vi.fn().mockResolvedValue({ error: { message: 'failure' } });
    const supabaseFromMock = vi.fn()
      .mockImplementationOnce(() => ({ insert: archiveInsertMock }));

    const supabaseClient = { from: supabaseFromMock } as unknown as SupabaseClient;
    getServiceClientMock.mockReturnValue(supabaseClient);

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: {
        user_id: 'user-123',
        source: 'apple_health',
        captured_at: '2024-05-05T07:00:00Z',
        metrics: [{ metric: 'sleep', value: 360, source: 'apple_health' }],
      },
    } as unknown as Request;

    const res = createMockResponse();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await syncWearableData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({ error: 'Failed to persist wearable archive: failure' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
