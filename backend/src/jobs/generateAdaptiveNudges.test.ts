import { generateAdaptiveNudges } from './generateAdaptiveNudges';

jest.mock('../lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getFirestore: jest.fn(),
}));

jest.mock('../lib/openai', () => ({
  getOpenAIClient: jest.fn(),
}));

jest.mock('../lib/pinecone', () => ({
  getPineconeIndex: jest.fn(),
}));

describe('generateAdaptiveNudges', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  const mockFirestore = {
    doc: jest.fn(),
  };

  const mockOpenAI = {
    embeddings: {
      create: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  const mockPineconeIndex = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (require('../lib/supabase').getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
    (require('../lib/firebase').getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (require('../lib/openai').getOpenAIClient as jest.Mock).mockReturnValue(mockOpenAI);
    (require('../lib/pinecone').getPineconeIndex as jest.Mock).mockReturnValue(mockPineconeIndex);
  });

  const buildChain = (handlers: Record<string, jest.Mock>) => {
    return Object.entries(handlers).reduce((acc, [key, handler]) => {
      acc[key] = handler;
      return acc;
    }, {} as Record<string, jest.Mock>);
  };

  it('generates AI nudges and logs audit records', async () => {
    const usersSelectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'user-1',
            tier: 'core',
            preferences: { nudge_tone: 'calm' },
            primary_module_id: 'sleep_module',
            onboarding_complete: true,
          },
        ],
        error: null,
      }),
    });

    const logsChain = buildChain({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                { protocol_id: 'protocol-1', status: 'completed', performed_at: '2024-04-01T00:00:00Z' },
              ],
              error: null,
            }),
          }),
        }),
      }),
    });

    const wearableChain = buildChain({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  hrv_score: 82,
                  sleep_hours: 7.5,
                  readiness_score: 76,
                  recorded_at: '2024-04-01T07:00:00Z',
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    });

    const auditInsertMock = jest.fn().mockResolvedValue({ data: null, error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      switch (table) {
        case 'users':
          return { select: usersSelectMock };
        case 'protocol_logs':
          return logsChain;
        case 'wearable_data_archive':
          return wearableChain;
        case 'ai_audit_log':
          return { insert: auditInsertMock };
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
    });

    mockPineconeIndex.query.mockResolvedValue({
      matches: [
        {
          id: 'protocol-1',
          score: 0.89,
          metadata: { name: 'Morning Light', citations: ['10.1177/07487304211001521'], module_id: 'sleep_module' },
        },
      ],
    });

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            function_call: {
              name: 'submit_nudge',
              arguments: JSON.stringify({
                protocol_id: 'protocol-1',
                module_id: 'sleep_module',
                nudge_text: 'Go outside for morning light.',
                reasoning: 'Supports circadian rhythm.',
                evidence_citation: '10.1177/07487304211001521',
                timing: 'tomorrow morning',
                confidence_score: 0.76,
              }),
            },
          },
        },
      ],
    });

    const docSetMock = jest.fn().mockResolvedValue(undefined);
    mockFirestore.doc.mockReturnValue({ set: docSetMock });

    await generateAdaptiveNudges(undefined, { timestamp: '2024-04-02T00:05:00Z' });

    expect(mockOpenAI.embeddings.create).toHaveBeenCalled();
    expect(mockPineconeIndex.query).toHaveBeenCalledWith({
      vector: expect.any(Array),
      topK: 5,
      includeMetadata: true,
    });

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5-turbo',
        function_call: { name: 'submit_nudge' },
      }),
    );

    expect(docSetMock).toHaveBeenCalledTimes(1);
    const [[nudgePayload]] = docSetMock.mock.calls;
    expect(nudgePayload.protocol_id).toBe('protocol-1');
    expect(nudgePayload.status).toBe('pending');

    expect(auditInsertMock).toHaveBeenCalledTimes(1);
    const [[auditRecord]] = auditInsertMock.mock.calls;
    expect(auditRecord.user_id).toBe('user-1');
    expect(auditRecord.status).toBe('success');
    expect(auditRecord.response_payload.protocol_id).toBe('protocol-1');
  });

  it('falls back to rule-based nudges when OpenAI errors', async () => {
    const usersSelectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'user-2',
            tier: 'core',
            preferences: {},
            primary_module_id: 'resilience_module',
            onboarding_complete: true,
          },
        ],
        error: null,
      }),
    });

    const logsChain = buildChain({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    });

    const wearableChain = buildChain({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  hrv_score: 55,
                  sleep_hours: 6,
                  readiness_score: 60,
                  recorded_at: '2024-04-01T06:00:00Z',
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    });

    const auditInsertMock = jest.fn().mockResolvedValue({ data: null, error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      switch (table) {
        case 'users':
          return { select: usersSelectMock };
        case 'protocol_logs':
          return logsChain;
        case 'wearable_data_archive':
          return wearableChain;
        case 'ai_audit_log':
          return { insert: auditInsertMock };
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    mockOpenAI.embeddings.create.mockResolvedValue({ data: [{ embedding: [0.2, 0.3, 0.4] }] });
    mockPineconeIndex.query.mockResolvedValue({ matches: [] });
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error('rate limit'));

    const docSetMock = jest.fn().mockResolvedValue(undefined);
    mockFirestore.doc.mockReturnValue({ set: docSetMock });

    await generateAdaptiveNudges(undefined, { timestamp: '2024-04-02T00:05:00Z' });

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    const [[fallbackPayload]] = docSetMock.mock.calls;
    expect(fallbackPayload.status).toBe('pending');
    expect(fallbackPayload.source).toBe('fallback');
    expect(auditInsertMock).toHaveBeenCalledTimes(1);
    const [[auditRecord]] = auditInsertMock.mock.calls;
    expect(auditRecord.status).toBe('fallback');
    expect(auditRecord.fallback_reason).toBe('openai_error');
  });
});

