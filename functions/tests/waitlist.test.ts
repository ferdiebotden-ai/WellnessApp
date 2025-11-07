import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { joinWaitlist } from '../src/waitlist';

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

const createResponse = (): MockResponse => {
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

const upsertMock = vi.fn();
const fromMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  verifyFirebaseTokenMock.mockResolvedValue({ uid: 'user-123' });
  upsertMock.mockResolvedValue({ data: null, error: null });
  fromMock.mockReturnValue({ upsert: upsertMock });
  getServiceClientMock.mockReturnValue({ from: fromMock } as unknown as SupabaseClient);
});

describe('joinWaitlist', () => {
  it('rejects unsupported methods', async () => {
    const req = { method: 'GET' } as unknown as Request;
    const res = createResponse();

    await joinWaitlist(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('requires bearer token', async () => {
    const req = { method: 'POST', headers: {}, body: {} } as unknown as Request;
    const res = createResponse();

    await joinWaitlist(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: 'Missing bearer token' });
  });

  it('validates bearer token', async () => {
    verifyFirebaseTokenMock.mockRejectedValueOnce(new Error('bad token'));

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: { email: 'user@example.com', tier_interested_in: 'pro' },
    } as unknown as Request;
    const res = createResponse();

    await joinWaitlist(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: 'Invalid bearer token' });
  });

  it('rejects invalid payload', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: { email: 'bad-email', tier_interested_in: 'gold' },
    } as unknown as Request;
    const res = createResponse();

    await joinWaitlist(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({ error: 'Valid email is required' });
  });

  it('stores waitlist entry', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: { email: 'User@example.com', tier_interested_in: 'elite' },
    } as unknown as Request;
    const res = createResponse();

    await joinWaitlist(req, res);

    expect(fromMock).toHaveBeenCalledWith('waitlist_entry');
    expect(upsertMock).toHaveBeenCalledWith(
      { email: 'user@example.com', tier_interested_in: 'elite' },
      { onConflict: 'email' }
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body).toEqual({ success: true });
  });

  it('handles Supabase failures', async () => {
    upsertMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: { email: 'user@example.com', tier_interested_in: 'pro' },
    } as unknown as Request;
    const res = createResponse();

    await joinWaitlist(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({ error: 'Failed to save waitlist entry' });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
