import { embedProtocols } from './embedProtocols';

jest.mock('../lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('../lib/openai', () => ({
  getOpenAIClient: jest.fn(),
}));

jest.mock('../lib/pinecone', () => ({
  getPineconeIndex: jest.fn(),
}));

describe('embedProtocols', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  const mockOpenAI = {
    embeddings: {
      create: jest.fn(),
    },
  };

  const mockPineconeIndex = {
    upsert: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (require('../lib/supabase').getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
    (require('../lib/openai').getOpenAIClient as jest.Mock).mockReturnValue(mockOpenAI);
    (require('../lib/pinecone').getPineconeIndex as jest.Mock).mockReturnValue(mockPineconeIndex);
  });

  it('returns early when no protocols are found', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    await embedProtocols();

    expect(mockOpenAI.embeddings.create).not.toHaveBeenCalled();
    expect(mockPineconeIndex.upsert).not.toHaveBeenCalled();
  });

  it('embeds and upserts active protocols', async () => {
    const selectMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'protocol-1',
          name: 'Morning Light',
          description: 'Get outside within 60 minutes of waking.',
          category: 'Circadian',
          tier_required: 'core',
          benefits: 'Supports sleep-wake cycle.',
          constraints: 'Morning execution.',
          citations: ['paper-1'],
          is_active: true,
        },
      ],
      error: null,
    });
    mockSupabase.from.mockReturnValue({ select: selectMock });

    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [
        {
          embedding: new Array(1536).fill(0.1),
        },
      ],
    });

    await embedProtocols();

    expect(selectMock).toHaveBeenCalled();
    expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
      model: 'text-embedding-3-large',
      input: [
        expect.stringContaining('Protocol: Morning Light'),
      ],
      dimensions: 1536,
    });

    expect(mockPineconeIndex.upsert).toHaveBeenCalledWith([
      {
        id: 'protocol-1',
        values: expect.any(Array),
        metadata: {
          protocol_id: 'protocol-1',
          name: 'Morning Light',
          category: 'Circadian',
          tier_required: 'core',
          citations: ['paper-1'],
        },
      },
    ]);
  });

  it('chunks requests when exceeding batch size', async () => {
    const protocols = Array.from({ length: 25 }, (_, index) => ({
      id: `protocol-${index}`,
      name: `Protocol ${index}`,
      description: `Description ${index}`,
      category: 'Test',
      tier_required: 'core',
      citations: [],
      is_active: true,
    }));

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: protocols, error: null }),
    });

    mockOpenAI.embeddings.create.mockImplementation(async ({ input }) => ({
      data: input.map(() => ({ embedding: new Array(1536).fill(0.2) })),
    }));

    await embedProtocols();

    expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2);
    expect(mockPineconeIndex.upsert).toHaveBeenCalledTimes(2);
  });
});
