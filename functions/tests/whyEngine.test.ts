/**
 * WhyEngine Tests
 *
 * Unit tests for the reasoning transparency engine.
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Session 12
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  extractMechanism,
  parseDOI,
  mapConfidenceLevel,
  generateConfidenceExplanation,
  generateWhyExpansion,
  WhyExpansion,
  ConfidenceLevel,
} from '../src/reasoning/whyEngine';
import { ConfidenceScore } from '../src/reasoning/types';
import { ScoredMemory } from '../src/memory';
import { ProtocolSearchResult } from '../src/protocolSearch';

// Test environment setup
process.env.FIREBASE_PROJECT_ID = 'demo-project';
process.env.FIREBASE_CLIENT_EMAIL = 'demo@example.com';
process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
process.env.SUPABASE_JWT_SECRET = 'secret';
process.env.DEFAULT_TRIAL_DAYS = '7';
process.env.OPENAI_API_KEY = 'openai-key';
process.env.PINECONE_API_KEY = 'pinecone-key';
process.env.PINECONE_INDEX_NAME = 'demo-index';
process.env.REVENUECAT_WEBHOOK_SECRET = 'webhook-secret';

// Mock vertexAI to avoid actual API calls
vi.mock('../src/vertexAI', () => ({
  generateCompletion: vi.fn().mockResolvedValue('Your energy improved 23% on walking days.'),
}));

describe('WhyEngine', () => {
  describe('extractMechanism', () => {
    it('should extract first 2 sentences from description', () => {
      const description =
        'Morning light exposure resets your circadian rhythm. This helps regulate melatonin production. Additional details about timing.';
      const result = extractMechanism(description);
      expect(result).toBe(
        'Morning light exposure resets your circadian rhythm. This helps regulate melatonin production.'
      );
    });

    it('should return single sentence if only one exists', () => {
      const description = 'Brief protocols support energy levels.';
      const result = extractMechanism(description);
      expect(result).toBe('Brief protocols support energy levels.');
    });

    it('should truncate to 250 chars if mechanism is too long', () => {
      const longSentence =
        'This is a very long first sentence that goes on and on and on explaining the complex physiological mechanism in incredible scientific detail with multiple pathways involved. ' +
        'This is an equally long second sentence that continues with even more detailed physiological and biochemical explanation that exceeds our character limit.';
      const result = extractMechanism(longSentence);
      expect(result.length).toBeLessThanOrEqual(250);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should return fallback for null description', () => {
      const result = extractMechanism(null);
      expect(result).toBe(
        'This protocol supports your wellness goals through evidence-based practices.'
      );
    });

    it('should return fallback for empty description', () => {
      const result = extractMechanism('');
      expect(result).toBe(
        'This protocol supports your wellness goals through evidence-based practices.'
      );
    });

    it('should handle sentences ending with exclamation marks', () => {
      const description = 'Wake up refreshed! This protocol optimizes your sleep cycle.';
      const result = extractMechanism(description);
      expect(result).toBe('Wake up refreshed! This protocol optimizes your sleep cycle.');
    });

    it('should handle sentences ending with question marks', () => {
      const description = 'Want better focus? Try this evidence-based approach.';
      const result = extractMechanism(description);
      expect(result).toBe('Want better focus? Try this evidence-based approach.');
    });
  });

  describe('parseDOI', () => {
    it('should extract DOI from citation string', () => {
      const citation =
        'Gooley et al. (2011). Exposure to room light before bedtime... doi: 10.1016/j.cub.2013.06.039';
      const result = parseDOI(citation);
      expect(result).toBe('10.1016/j.cub.2013.06.039');
    });

    it('should extract DOI with different prefix format', () => {
      const citation =
        'Chang et al. (2015). Evening use of light-emitting eReaders... 10.1073/pnas.1418490112';
      const result = parseDOI(citation);
      expect(result).toBe('10.1073/pnas.1418490112');
    });

    it('should return undefined for citation without DOI', () => {
      const citation = 'Huberman Lab Podcast (2023). Morning Light Protocol.';
      const result = parseDOI(citation);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty citation', () => {
      const result = parseDOI('');
      expect(result).toBeUndefined();
    });

    it('should clean trailing punctuation from DOI', () => {
      const citation = 'Reference with DOI 10.1234/test.12345.';
      const result = parseDOI(citation);
      expect(result).toBe('10.1234/test.12345');
    });

    it('should handle DOI with complex suffix', () => {
      const citation = 'Study about sleep 10.1038/s41586-019-1545-9 published in Nature.';
      const result = parseDOI(citation);
      expect(result).toBe('10.1038/s41586-019-1545-9');
    });

    it('should extract first DOI if multiple exist', () => {
      const citation = 'See 10.1016/first and also 10.1016/second for details.';
      const result = parseDOI(citation);
      expect(result).toBe('10.1016/first');
    });
  });

  describe('mapConfidenceLevel', () => {
    it('should return High for score > 0.7', () => {
      expect(mapConfidenceLevel(0.71)).toBe('High');
      expect(mapConfidenceLevel(0.8)).toBe('High');
      expect(mapConfidenceLevel(0.95)).toBe('High');
      expect(mapConfidenceLevel(1.0)).toBe('High');
    });

    it('should return Medium for score >= 0.4 and <= 0.7', () => {
      expect(mapConfidenceLevel(0.4)).toBe('Medium');
      expect(mapConfidenceLevel(0.5)).toBe('Medium');
      expect(mapConfidenceLevel(0.6)).toBe('Medium');
      expect(mapConfidenceLevel(0.7)).toBe('Medium');
    });

    it('should return Low for score < 0.4', () => {
      expect(mapConfidenceLevel(0.39)).toBe('Low');
      expect(mapConfidenceLevel(0.3)).toBe('Low');
      expect(mapConfidenceLevel(0.1)).toBe('Low');
      expect(mapConfidenceLevel(0)).toBe('Low');
    });

    it('should handle boundary values correctly', () => {
      // 0.7 is Medium (not > 0.7)
      expect(mapConfidenceLevel(0.7)).toBe('Medium');
      // 0.4 is Medium (>= 0.4)
      expect(mapConfidenceLevel(0.4)).toBe('Medium');
    });
  });

  describe('generateConfidenceExplanation', () => {
    const createConfidenceScore = (
      overall: number,
      evidenceStrength = 0.8
    ): ConfidenceScore => ({
      overall,
      factors: {
        protocol_fit: 0.8,
        memory_support: 0.7,
        timing_fit: 0.9,
        conflict_risk: 0.1,
        evidence_strength: evidenceStrength,
      },
      should_suppress: overall < 0.4,
      reasoning: 'Test reasoning',
    });

    it('should mention memory count for High confidence with many memories', () => {
      const confidence = createConfidenceScore(0.85);
      const result = generateConfidenceExplanation(confidence, 7);
      expect(result).toContain('7+');
      expect(result).toContain('patterns');
    });

    it('should mention research evidence for High confidence with high evidence', () => {
      const confidence = createConfidenceScore(0.75, 0.9);
      const result = generateConfidenceExplanation(confidence, 2);
      expect(result).toContain('research');
    });

    it('should mention goals and timing for High without many memories', () => {
      const confidence = createConfidenceScore(0.75, 0.6);
      const result = generateConfidenceExplanation(confidence, 2);
      expect(result).toContain('goals');
      expect(result).toContain('timing');
    });

    it('should mention patterns for Medium confidence with memories', () => {
      const confidence = createConfidenceScore(0.55);
      const result = generateConfidenceExplanation(confidence, 3);
      expect(result).toContain('3');
      expect(result).toContain('patterns');
    });

    it('should mention moderate evidence for Medium without memories', () => {
      const confidence = createConfidenceScore(0.5);
      const result = generateConfidenceExplanation(confidence, 0);
      expect(result.toLowerCase()).toContain('moderate');
    });

    it('should mention limited data for Low confidence', () => {
      const confidence = createConfidenceScore(0.3);
      const result = generateConfidenceExplanation(confidence, 1);
      expect(result.toLowerCase()).toContain('limited');
    });
  });

  describe('generateWhyExpansion', () => {
    const mockProtocol: ProtocolSearchResult = {
      id: 'morning-light',
      name: 'Morning Light Exposure',
      description:
        'Exposure to bright light within 30 minutes of waking helps reset your circadian rhythm. This promotes better sleep timing and energy levels.',
      category: 'Foundation',
      tier_required: 'free',
      benefits: 'Improved sleep timing, better energy',
      constraints: null,
      citations: [
        'Gooley et al. (2011). Exposure to room light before bedtime suppresses melatonin onset. doi: 10.1016/j.cub.2013.06.039',
      ],
      score: 0.95,
    };

    const mockConfidence: ConfidenceScore = {
      overall: 0.78,
      factors: {
        protocol_fit: 0.85,
        memory_support: 0.7,
        timing_fit: 0.9,
        conflict_risk: 0.1,
        evidence_strength: 0.8,
      },
      should_suppress: false,
      reasoning: 'Strong fit for sleep goal',
    };

    const mockMemories: ScoredMemory[] = [
      {
        id: 'mem-1',
        user_id: 'user-123',
        type: 'pattern_detected',
        content: 'Better energy on morning light days',
        confidence: 0.85,
        evidence_count: 12,
        decay_rate: 0.05,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        relevance_score: 0.9,
      },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return complete WhyExpansion object', async () => {
      const result = await generateWhyExpansion({
        protocol: mockProtocol,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      expect(result).toHaveProperty('mechanism');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('your_data');
      expect(result).toHaveProperty('confidence');
    });

    it('should extract mechanism from description', async () => {
      const result = await generateWhyExpansion({
        protocol: mockProtocol,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      expect(result.mechanism).toContain('circadian rhythm');
    });

    it('should parse DOI from citation', async () => {
      const result = await generateWhyExpansion({
        protocol: mockProtocol,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      expect(result.evidence.doi).toBe('10.1016/j.cub.2013.06.039');
    });

    it('should include full citation', async () => {
      const result = await generateWhyExpansion({
        protocol: mockProtocol,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      expect(result.evidence.citation).toContain('Gooley');
    });

    it('should map confidence level correctly', async () => {
      const result = await generateWhyExpansion({
        protocol: mockProtocol,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      expect(result.confidence.level).toBe('High');
    });

    it('should keep your_data under 150 characters', async () => {
      const result = await generateWhyExpansion({
        protocol: mockProtocol,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      expect(result.your_data.length).toBeLessThanOrEqual(150);
    });

    it('should handle protocol without citations gracefully', async () => {
      const protocolNoCitations: ProtocolSearchResult = {
        ...mockProtocol,
        citations: [],
      };

      const result = await generateWhyExpansion({
        protocol: protocolNoCitations,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      expect(result.evidence.citation).toBe('Evidence-based wellness protocol.');
      expect(result.evidence.doi).toBeUndefined();
    });

    it('should handle empty memories array', async () => {
      const result = await generateWhyExpansion({
        protocol: mockProtocol,
        confidence: mockConfidence,
        memories: [],
        userId: 'user-123',
      });

      expect(result.your_data).toBeDefined();
      expect(result.your_data.length).toBeGreaterThan(0);
    });

    it('should set default evidence level when not in protocol', async () => {
      const result = await generateWhyExpansion({
        protocol: mockProtocol,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      // Default to Moderate when not specified
      expect(result.evidence.strength).toBe('Moderate');
    });

    it('should use protocol evidence_level when available', async () => {
      const protocolWithEvidence = {
        ...mockProtocol,
        evidence_level: 'Very High' as const,
      };

      const result = await generateWhyExpansion({
        protocol: protocolWithEvidence,
        confidence: mockConfidence,
        memories: mockMemories,
        userId: 'user-123',
      });

      expect(result.evidence.strength).toBe('Very High');
    });
  });

  describe('WhyExpansion Type Validation', () => {
    it('should have correct structure for WhyExpansion', () => {
      const expansion: WhyExpansion = {
        mechanism: 'Test mechanism explanation.',
        evidence: {
          citation: 'Test et al. (2024)',
          doi: '10.1234/test',
          strength: 'High',
        },
        your_data: 'Your personalized insight.',
        confidence: {
          level: 'High',
          explanation: 'Based on your data',
        },
      };

      expect(expansion.mechanism).toBeDefined();
      expect(expansion.evidence.citation).toBeDefined();
      expect(expansion.evidence.strength).toBeDefined();
      expect(expansion.your_data).toBeDefined();
      expect(expansion.confidence.level).toBeDefined();
      expect(expansion.confidence.explanation).toBeDefined();
    });

    it('should accept all valid ConfidenceLevel values', () => {
      const levels: ConfidenceLevel[] = ['High', 'Medium', 'Low'];
      levels.forEach((level) => {
        expect(['High', 'Medium', 'Low']).toContain(level);
      });
    });
  });
});
