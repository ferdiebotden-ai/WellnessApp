import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { handleRevenueCatWebhook } from '../src/revenuecatWebhook';

const getServiceClientMock = vi.fn();

vi.mock('../src/supabaseClient', () => ({
  getServiceClient: getServiceClientMock,
}));

const buildResponse = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  });
  res.json = vi.fn((payload: unknown) => {
    res.body = payload;
    return res as Response;
  });
  return res as Response & { statusCode?: number; body?: unknown };
};

const updateMock = vi.fn();
const eqMock = vi.fn();
const selectMock = vi.fn();
const maybeSingleMock = vi.fn();
const fromMock = vi.fn();

const SECRET = 'test-secret';

process.env.FIREBASE_PROJECT_ID = 'demo-project';
process.env.FIREBASE_CLIENT_EMAIL = 'demo@example.com';
process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
process.env.SUPABASE_JWT_SECRET = 'secret';
process.env.DEFAULT_TRIAL_DAYS = '14';
process.env.OPENAI_API_KEY = 'openai-key';
process.env.PINECONE_API_KEY = 'pinecone-key';
process.env.REVENUECAT_WEBHOOK_SECRET = SECRET;

const createSignedRequest = (body: unknown): Request & { rawBody: Buffer } => {
  const rawBody = Buffer.from(JSON.stringify(body));
  const signature = crypto.createHmac('sha256', SECRET).update(rawBody).digest('base64');

  return {
    method: 'POST',
    headers: { 'x-revenuecat-signature': signature },
    body,
    rawBody,
  } as unknown as Request & { rawBody: Buffer };
};

beforeEach(() => {
  vi.clearAllMocks();
  maybeSingleMock.mockResolvedValue({ data: { id: 'user-123' }, error: null });
  selectMock.mockReturnValue({ maybeSingle: maybeSingleMock });
  eqMock.mockReturnValue({ select: selectMock });
  updateMock.mockReturnValue({ eq: eqMock });
  fromMock.mockReturnValue({ update: updateMock });
  getServiceClientMock.mockReturnValue({ from: fromMock } as unknown as SupabaseClient);
});

describe('handleRevenueCatWebhook', () => {
  it('rejects non-POST methods', async () => {
    const req = { method: 'GET' } as unknown as Request & { rawBody: Buffer };
    const res = buildResponse();

    await handleRevenueCatWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('returns 401 when signature is invalid', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-revenuecat-signature': 'invalid' },
      body: {},
      rawBody: Buffer.from('{}'),
    } as unknown as Request & { rawBody: Buffer };
    const res = buildResponse();

    await handleRevenueCatWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: 'Invalid webhook signature' });
  });

  it('updates user tier when receiving a Core activation event', async () => {
    const payload = {
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-123',
        product_id: 'core_monthly',
        transaction_id: 'rc_txn_1',
      },
    };

    const req = createSignedRequest(payload);
    const res = buildResponse();

    await handleRevenueCatWebhook(req, res);

    expect(fromMock).toHaveBeenCalledWith('users');
    expect(updateMock).toHaveBeenCalledWith({ tier: 'core', subscription_id: 'rc_txn_1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({ acknowledged: true });
  });

  it('clears subscription when cancellation event arrives', async () => {
    const payload = {
      event: {
        type: 'CANCELLATION',
        app_user_id: 'user-123',
        product_id: 'core_monthly',
        original_transaction_id: 'rc_txn_1',
      },
    };

    const req = createSignedRequest(payload);
    const res = buildResponse();

    await handleRevenueCatWebhook(req, res);

    expect(updateMock).toHaveBeenCalledWith({ tier: 'free', subscription_id: null });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('ignores events for unrelated products', async () => {
    const payload = {
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-123',
        product_id: 'other_product',
      },
    };

    const req = createSignedRequest(payload);
    const res = buildResponse();

    await handleRevenueCatWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.body).toEqual({ ignored: true });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
