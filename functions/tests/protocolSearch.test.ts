import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceConfig } from '../src/config';
import { searchProtocols, resetPineconeHostCache } from '../src/protocolSearch';

const fetchMock = vi.fn();
const getServiceClientMock = vi.fn();
const getConfigMock = vi.fn<() => ServiceConfig>();

vi.mock('../src/supabaseClient', () => ({
  getServiceClient: getServiceClientMock,
}));

vi.mock('../src/config', async () => {
  const actual = await vi.importActual<typeof import('../src/config')>('../src/config');
  return {
    ...actual,
    getConfig: getConfigMock,
  };
});

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
  res.send = vi.fn((payload: unknown) => {
    res.body = payload;
    return res as Response;
  });
  return res as MockResponse;
};

const createJsonResponse = (data: unknown, status = 200): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
}) as unknown as Response;

const baseConfig: ServiceConfig = {
  firebaseProjectId: 'demo-project',
  firebaseClientEmail: 'demo@example.com',
  firebasePrivateKey: 'key',
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'anon',
  supabaseServiceRoleKey: 'service-role',
  supabaseJwtSecret: 'secret',
  defaultTrialDays: 14,
  openAiApiKey: 'openai-key',
  pineconeApiKey: 'pinecone-key',
  pineconeIndexName: 'protocols-index',
};

const supabaseInMock = vi.fn();
const supabaseSelectMock = vi.fn();
const supabaseFromMock = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  getConfigMock.mockReset();
  getServiceClientMock.mockReset();
  supabaseInMock.mockReset();
  supabaseSelectMock.mockReset();
  supabaseFromMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  getConfigMock.mockReturnValue(baseConfig);
  resetPineconeHostCache();
  supabaseInMock.mockResolvedValue({
    data: [
      {
        id: 'protocol-1',
        name: 'Morning Light',
        description: 'Sun exposure routine',
        category: 'sleep',
        tier_required: 'free',
        benefits: 'Better circadian rhythm',
        constraints: null,
        citations: ['ref-one', 123],
        is_active: true,
      },
      {
        id: 'protocol-2',
        name: 'Evening Routine',
        description: 'Wind-down habits',
        category: 'sleep',
        tier_required: 'pro',
        benefits: null,
        constraints: null,
        citations: null,
        is_active: false,
      },
    ],
    error: null,
  });
  supabaseSelectMock.mockReturnValue({ in: supabaseInMock });
  supabaseFromMock.mockReturnValue({ select: supabaseSelectMock });
  getServiceClientMock.mockReturnValue({ from: supabaseFromMock } as unknown as SupabaseClient);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchProtocols', () => {
  it('returns 405 for unsupported methods', async () => {
    const req = { method: 'POST', query: {} } as unknown as Request;
    const res = createMockResponse();

    await searchProtocols(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 when query parameter is missing', async () => {
    const req = { method: 'GET', query: {} } as unknown as Request;
    const res = createMockResponse();

    await searchProtocols(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({ error: 'Query parameter "q" is required' });
  });

  it('returns ranked protocols from Pinecone matches', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ data: [{ embedding: [0.1, 0.2, 0.3] }] }))
      .mockResolvedValueOnce(createJsonResponse({ host: 'protocols-index-xyz.svc.use1-aws.pinecone.io' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          matches: [
            { id: 'protocol-1', score: 0.92 },
            { id: null, metadata: { protocol_id: 'protocol-2' }, score: 0.88 },
            { id: 'protocol-1', score: 0.5 },
          ],
        }),
      );

    const req = { method: 'GET', query: { q: 'sleep', limit: '5' } } as unknown as Request;
    const res = createMockResponse();

    await searchProtocols(req, res);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.openai.com/v1/embeddings');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.pinecone.io/indexes/protocols-index');
    expect(fetchMock.mock.calls[2]?.[0]).toBe('https://protocols-index-xyz.svc.use1-aws.pinecone.io/query');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual([
      {
        id: 'protocol-1',
        name: 'Morning Light',
        description: 'Sun exposure routine',
        category: 'sleep',
        tier_required: 'free',
        benefits: 'Better circadian rhythm',
        constraints: null,
        citations: ['ref-one'],
        score: 0.92,
      },
    ]);
  });

  it('responds with 500 when Supabase query fails', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ data: [{ embedding: [0.1] }] }))
      .mockResolvedValueOnce(createJsonResponse({ host: 'protocols-index-xyz.svc.use1-aws.pinecone.io' }))
      .mockResolvedValueOnce(createJsonResponse({ matches: [{ id: 'protocol-1', score: 0.9 }] }));

    supabaseInMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = { method: 'GET', query: { q: 'sleep' } } as unknown as Request;
    const res = createMockResponse();

    await searchProtocols(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({ error: 'Failed to search protocols' });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
