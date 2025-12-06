/**
 * Mock Factories for Integration Tests
 *
 * Provides deterministic mocks for external services:
 * - Pinecone (vector database for protocol search)
 * - Vertex AI (Gemini for nudge generation)
 * - Firebase Admin (Firestore real-time sync)
 *
 * @file functions/tests/integration/mocks/index.ts
 * @author Claude Opus 4.5 (Session 51)
 * @created December 5, 2025
 */

import { vi } from 'vitest';

// =============================================================================
// PINECONE MOCK
// =============================================================================

/**
 * Mock Pinecone query results for protocol search.
 */
export const MOCK_PROTOCOL_RESULTS = [
  {
    id: 'protocol-light-exposure',
    score: 0.92,
    metadata: {
      title: 'Morning Light Exposure',
      module: 'sleep-optimization',
      evidence_strength: 'strong',
      time_of_day: 'morning',
      duration_minutes: 10,
      description: 'Get 10+ minutes of bright light within 30 minutes of waking.',
      citation: 'Huberman Lab Podcast, Episode 2',
    },
  },
  {
    id: 'protocol-hydration',
    score: 0.88,
    metadata: {
      title: 'Morning Hydration',
      module: 'energy-boost',
      evidence_strength: 'moderate',
      time_of_day: 'morning',
      duration_minutes: 1,
      description: 'Drink 16-32oz of water within first hour of waking.',
      citation: 'Huberman Lab Podcast, Episode 5',
    },
  },
  {
    id: 'protocol-caffeine-delay',
    score: 0.85,
    metadata: {
      title: 'Caffeine Delay',
      module: 'energy-boost',
      evidence_strength: 'moderate',
      time_of_day: 'morning',
      duration_minutes: 90,
      description: 'Delay caffeine intake 90-120 minutes after waking.',
      citation: 'Huberman Lab Podcast, Episode 101',
    },
  },
];

/**
 * Create a mock Pinecone index.
 */
export function createPineconeMock() {
  const queryMock = vi.fn().mockResolvedValue({
    matches: MOCK_PROTOCOL_RESULTS,
  });

  const indexMock = {
    query: queryMock,
    namespace: vi.fn().mockReturnThis(),
  };

  const pineconeClientMock = {
    Index: vi.fn().mockReturnValue(indexMock),
  };

  return {
    client: pineconeClientMock,
    index: indexMock,
    query: queryMock,
    setResults: (results: typeof MOCK_PROTOCOL_RESULTS) => {
      queryMock.mockResolvedValue({ matches: results });
    },
    setError: (error: Error) => {
      queryMock.mockRejectedValue(error);
    },
  };
}

// =============================================================================
// VERTEX AI MOCK
// =============================================================================

/**
 * Mock Vertex AI (Gemini) response for nudge generation.
 */
export const MOCK_AI_RESPONSE = {
  nudge_text:
    'Start your day with 10 minutes of morning sunlight. Your HRV is 15% above baseline—capitalize on this energy with an early light protocol.',
  reasoning:
    "Based on your recovery score of 78 and excellent sleep quality (88% efficiency), you're in optimal condition for the morning light exposure protocol.",
  confidence: 0.85,
  why_expansion: {
    mechanism:
      'Morning light exposure triggers cortisol awakening response and suppresses melatonin, setting your circadian rhythm.',
    evidence:
      'Research shows 10+ minutes of outdoor light (>10,000 lux) within 30 minutes of waking improves alertness and sleep quality (Blume et al., 2019).',
    your_data:
      'Your HRV of 55ms is 15% above your 48ms baseline, indicating strong parasympathetic recovery. Sleep efficiency of 88% suggests quality rest.',
    confidence_factors: [
      'High confidence baseline (14 days of data)',
      'Recovery zone: green',
      'Time of day: optimal for morning protocols',
    ],
  },
};

/**
 * Create a mock Vertex AI client.
 */
export function createVertexAIMock() {
  const generateContentMock = vi.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify(MOCK_AI_RESPONSE),
      candidates: [{ content: { parts: [{ text: JSON.stringify(MOCK_AI_RESPONSE) }] } }],
    },
  });

  const modelMock = {
    generateContent: generateContentMock,
    startChat: vi.fn().mockReturnValue({
      sendMessage: generateContentMock,
    }),
  };

  const vertexAIMock = {
    getGenerativeModel: vi.fn().mockReturnValue(modelMock),
  };

  return {
    vertexAI: vertexAIMock,
    model: modelMock,
    generateContent: generateContentMock,
    setResponse: (response: typeof MOCK_AI_RESPONSE) => {
      generateContentMock.mockResolvedValue({
        response: {
          text: () => JSON.stringify(response),
          candidates: [{ content: { parts: [{ text: JSON.stringify(response) }] } }],
        },
      });
    },
    setError: (error: Error) => {
      generateContentMock.mockRejectedValue(error);
    },
  };
}

// =============================================================================
// FIREBASE ADMIN MOCK
// =============================================================================

/**
 * Create a mock Firestore client for real-time sync testing.
 */
export function createFirestoreMock() {
  const docData: Map<string, unknown> = new Map();

  const setMock = vi.fn().mockImplementation(async (data: unknown, options?: unknown) => {
    docData.set('current', data);
    return Promise.resolve();
  });

  const getMock = vi.fn().mockImplementation(async () => {
    const data = docData.get('current');
    return {
      exists: data !== undefined,
      data: () => data,
      id: 'mock-doc-id',
    };
  });

  const updateMock = vi.fn().mockImplementation(async (data: unknown) => {
    const current = docData.get('current') || {};
    docData.set('current', { ...(current as object), ...(data as object) });
    return Promise.resolve();
  });

  const deleteMock = vi.fn().mockImplementation(async () => {
    docData.delete('current');
    return Promise.resolve();
  });

  const docMock = vi.fn().mockReturnValue({
    set: setMock,
    get: getMock,
    update: updateMock,
    delete: deleteMock,
    collection: vi.fn().mockReturnThis(),
  });

  const collectionMock = vi.fn().mockReturnValue({
    doc: docMock,
    add: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
  });

  const firestoreMock = {
    collection: collectionMock,
    doc: docMock,
    batch: vi.fn().mockReturnValue({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue([]),
    }),
  };

  return {
    firestore: firestoreMock,
    collection: collectionMock,
    doc: docMock,
    set: setMock,
    get: getMock,
    update: updateMock,
    delete: deleteMock,
    getData: () => docData.get('current'),
    clearData: () => docData.clear(),
  };
}

// =============================================================================
// COMBINED MOCK SETUP
// =============================================================================

/**
 * Set up all mocks for integration tests.
 * Call this in beforeEach.
 */
export function setupAllMocks() {
  const pinecone = createPineconeMock();
  const vertexAI = createVertexAIMock();
  const firestore = createFirestoreMock();

  return {
    pinecone,
    vertexAI,
    firestore,
    resetAll: () => {
      vi.clearAllMocks();
      firestore.clearData();
    },
  };
}
