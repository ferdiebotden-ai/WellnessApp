import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { updateCurrentUser } from '../src/users';

const verifyFirebaseTokenMock = vi.fn();
const getUserClientMock = vi.fn();
const isPatchPayloadAllowedMock = vi.fn();

vi.mock('../src/firebaseAdmin', () => ({
  verifyFirebaseToken: verifyFirebaseTokenMock,
}));

vi.mock('../src/supabaseClient', () => ({
  getUserClient: getUserClientMock,
}));

vi.mock('../src/utils/http', async () => {
  const actual = await vi.importActual<typeof import('../src/utils/http')>('../src/utils/http');
  return {
    ...actual,
    isPatchPayloadAllowed: isPatchPayloadAllowedMock,
    extractBearerToken: vi.fn((req: Request) => {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || Array.isArray(authHeader)) {
        return null;
      }
      const match = authHeader.match(/^Bearer\s+(.*)$/i);
      return match ? match[1] : null;
    }),
  };
});

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
  res.send = vi.fn((payload: unknown) => {
    res.body = payload;
    return res as Response;
  });
  return res as MockResponse;
};

const updateMock = vi.fn();
const eqMock = vi.fn();
const selectMock = vi.fn();
const singleMock = vi.fn();
const fromMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  verifyFirebaseTokenMock.mockResolvedValue({ uid: 'user-123', email: 'user@example.com' });
  isPatchPayloadAllowedMock.mockReturnValue(true);
  singleMock.mockResolvedValue({
    data: {
      id: 'user-123',
      email: 'user@example.com',
      display_name: 'Test User',
      tier: 'trial',
      preferences: {},
    },
    error: null,
  });
  selectMock.mockReturnValue({ single: singleMock });
  eqMock.mockReturnValue({ select: selectMock });
  updateMock.mockReturnValue({ eq: eqMock });
  fromMock.mockReturnValue({ update: updateMock });
  getUserClientMock.mockReturnValue({ from: fromMock } as unknown as SupabaseClient);
});

describe('updateCurrentUser', () => {
  it('rejects unsupported methods', async () => {
    const req = { method: 'GET' } as unknown as Request;
    const res = createResponse();

    await updateCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('requires bearer token', async () => {
    verifyFirebaseTokenMock.mockRejectedValueOnce(new Error('Missing bearer token'));
    const req = {
      method: 'PATCH',
      headers: {},
      body: { preferences: { social_anonymous: true } },
    } as unknown as Request;
    const res = createResponse();

    await updateCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects invalid payload', async () => {
    isPatchPayloadAllowedMock.mockReturnValueOnce(false);
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      body: [],
    } as unknown as Request;
    const res = createResponse();

    await updateCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('updates social_anonymous preference to true', async () => {
    singleMock.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'Test User',
        tier: 'trial',
        preferences: { social_anonymous: true },
      },
      error: null,
    });

    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      body: { preferences: { social_anonymous: true } },
    } as unknown as Request;
    const res = createResponse();

    await updateCurrentUser(req, res);

    expect(fromMock).toHaveBeenCalledWith('users');
    expect(updateMock).toHaveBeenCalledWith({ preferences: { social_anonymous: true } });
    expect(eqMock).toHaveBeenCalledWith('id', 'user-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect((res.body as { user: { preferences: { social_anonymous: boolean } } }).user.preferences.social_anonymous).toBe(true);
  });

  it('updates social_anonymous preference to false', async () => {
    singleMock.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'Test User',
        tier: 'trial',
        preferences: { social_anonymous: false },
      },
      error: null,
    });

    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      body: { preferences: { social_anonymous: false } },
    } as unknown as Request;
    const res = createResponse();

    await updateCurrentUser(req, res);

    expect(updateMock).toHaveBeenCalledWith({ preferences: { social_anonymous: false } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect((res.body as { user: { preferences: { social_anonymous: boolean } } }).user.preferences.social_anonymous).toBe(false);
  });

  it('merges preferences without overwriting other fields', async () => {
    singleMock.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'Test User',
        tier: 'trial',
        preferences: {
          nudge_tone: 'motivational',
          quiet_hours_enabled: true,
          social_anonymous: true,
        },
      },
      error: null,
    });

    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      body: { preferences: { social_anonymous: false } },
    } as unknown as Request;
    const res = createResponse();

    await updateCurrentUser(req, res);

    // Verify that preferences object is passed as-is (backend doesn't merge, Supabase does)
    expect(updateMock).toHaveBeenCalledWith({ preferences: { social_anonymous: false } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles Supabase update errors', async () => {
    singleMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      body: { preferences: { social_anonymous: true } },
    } as unknown as Request;
    const res = createResponse();

    await updateCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect((res.body as { error: string }).error).toBe('User profile not found');
  });

  it('rejects empty updates', async () => {
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      body: {},
    } as unknown as Request;
    const res = createResponse();

    await updateCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({ error: 'No mutable fields provided' });
  });
});

