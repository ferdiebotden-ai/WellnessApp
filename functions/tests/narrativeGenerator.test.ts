/**
 * Narrative Generator Tests
 *
 * Tests for weekly synthesis narrative generation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the external dependencies
vi.mock('../src/vertexAI', () => ({
  generateCompletion: vi.fn(),
}));

vi.mock('../src/safety', () => ({
  scanAIOutput: vi.fn(() => ({ safe: true, flaggedKeywords: [], severity: null })),
  getSafeFallbackResponse: vi.fn(() => 'Safe fallback response'),
}));

vi.mock('../src/memory', () => ({
  getRelevantMemories: vi.fn(() => Promise.resolve([])),
}));

import {
  generateWeeklyNarrative,
  validateNarrative,
} from '../src/synthesis/narrativeGenerator';
import { generateCompletion } from '../src/vertexAI';
import { scanAIOutput } from '../src/safety';
import type { WeeklyMetrics, UserSynthesisContext } from '../src/synthesis/types';

const mockGenerateCompletion = generateCompletion as ReturnType<typeof vi.fn>;
const mockScanAIOutput = scanAIOutput as ReturnType<typeof vi.fn>;

describe('generateWeeklyNarrative', () => {
  const mockUser: UserSynthesisContext = {
    display_name: 'John',
    primary_goal: 'Better sleep',
    timezone: 'America/New_York',
  };

  const mockMetrics: WeeklyMetrics = {
    user_id: 'user-123',
    week_start: '2025-12-01',
    week_end: '2025-12-07',
    protocol_adherence: 75,
    days_with_completion: 6,
    total_protocols_completed: 12,
    avg_recovery_score: 72,
    hrv_trend_percent: 5.2,
    sleep_quality_trend_percent: 3.1,
    protocol_breakdown: [
      {
        protocol_id: 'proto-1',
        name: 'Morning Light',
        completed_days: 6,
        total_completions: 7,
        avg_duration_minutes: 15,
        completion_rate: 86,
      },
      {
        protocol_id: 'proto-2',
        name: 'Evening Wind-down',
        completed_days: 5,
        total_completions: 5,
        avg_duration_minutes: 20,
        completion_rate: 71,
      },
    ],
    correlations: [
      {
        protocol: 'proto-1',
        protocol_name: 'Morning Light',
        outcome: 'hrv_score',
        correlation: 0.65,
        p_value: 0.02,
        is_significant: true,
        sample_size: 21,
        direction: 'positive',
        interpretation: 'Strong positive correlation with HRV',
      },
    ],
    data_days_available: 7,
    has_wearable_data: true,
    week_over_week: {
      protocol_adherence_change: 8,
      protocols_completed_change: 2,
      recovery_score_change: 3,
    },
    generated_at: '2025-12-08T09:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate narrative with complete metrics', async () => {
    const mockNarrative = `John, your week showed solid progress. Your 75% protocol adherence marks an 8% improvement from last week. Your HRV trended up 5.2% which suggests better recovery. One area to watch is your Evening Wind-down protocol, which dipped to 71% completion. We noticed Morning Light exposure correlates strongly with your HRV improvements. If this trajectory continues, expect even better recovery scores ahead. Try adding 5 extra minutes to your morning light exposure this week.`;

    mockGenerateCompletion.mockResolvedValue(mockNarrative);
    mockScanAIOutput.mockReturnValue({ safe: true, flaggedKeywords: [], severity: null });

    const result = await generateWeeklyNarrative(mockUser, mockMetrics, []);

    expect(result.user_id).toBe('user-123');
    expect(result.week_start).toBe('2025-12-01');
    expect(result.week_end).toBe('2025-12-07');
    expect(result.narrative).toBe(mockNarrative);
    expect(result.word_count).toBeGreaterThan(0);
    expect(mockGenerateCompletion).toHaveBeenCalled();
  });

  it('should return fallback when data is insufficient', async () => {
    const insufficientMetrics: WeeklyMetrics = {
      ...mockMetrics,
      data_days_available: 2, // Less than MIN_DATA_DAYS (4)
    };

    const result = await generateWeeklyNarrative(mockUser, insufficientMetrics, []);

    expect(result.narrative).toContain('needs a bit more data');
    expect(result.sections_detected).toHaveLength(0);
    expect(mockGenerateCompletion).not.toHaveBeenCalled();
  });

  it('should handle AI generation failure gracefully', async () => {
    mockGenerateCompletion.mockRejectedValue(new Error('API error'));

    const result = await generateWeeklyNarrative(mockUser, mockMetrics, []);

    expect(result.narrative).toContain('temporarily unavailable');
    expect(result.sections_detected).toHaveLength(0);
  });

  it('should replace unsafe content with fallback', async () => {
    const unsafeNarrative = 'Some unsafe content here';
    mockGenerateCompletion.mockResolvedValue(unsafeNarrative);
    mockScanAIOutput.mockReturnValue({
      safe: false,
      flaggedKeywords: ['unsafe'],
      severity: 'high',
      reason: 'Contains flagged content',
    });

    const result = await generateWeeklyNarrative(mockUser, mockMetrics, []);

    expect(result.narrative).not.toBe(unsafeNarrative);
  });

  it('should detect narrative sections correctly', async () => {
    const narrativeWithSections = `John, your biggest win was the 5.2% HRV improvement. Watch your evening routine which needs attention. The pattern we noticed is that morning light correlates with better sleep. If you continue this trajectory, expect significant recovery gains. Try an experiment: add 10 minutes of sunlight after waking.`;

    mockGenerateCompletion.mockResolvedValue(narrativeWithSections);
    mockScanAIOutput.mockReturnValue({ safe: true, flaggedKeywords: [], severity: null });

    const result = await generateWeeklyNarrative(mockUser, mockMetrics, []);

    // Should detect multiple sections
    expect(result.sections_detected.length).toBeGreaterThanOrEqual(3);
  });

  it('should include metrics snapshot in result', async () => {
    mockGenerateCompletion.mockResolvedValue('Test narrative');
    mockScanAIOutput.mockReturnValue({ safe: true, flaggedKeywords: [], severity: null });

    const result = await generateWeeklyNarrative(mockUser, mockMetrics, []);

    expect(result.metrics_snapshot).toEqual(mockMetrics);
  });
});

describe('validateNarrative', () => {
  it('should validate narrative within word count range', () => {
    const validResult = {
      user_id: 'user-123',
      week_start: '2025-12-01',
      week_end: '2025-12-07',
      narrative: 'Word '.repeat(50), // 200 words
      metrics_snapshot: {} as WeeklyMetrics,
      generated_at: new Date().toISOString(),
      word_count: 200,
      sections_detected: ['Win', 'Watch', 'Pattern', 'Trajectory', 'Experiment'] as const,
    };

    const { valid, issues } = validateNarrative(validResult);
    expect(valid).toBe(true);
    expect(issues).toHaveLength(0);
  });

  it('should flag narrative with too few words', () => {
    const shortResult = {
      user_id: 'user-123',
      week_start: '2025-12-01',
      week_end: '2025-12-07',
      narrative: 'Short',
      metrics_snapshot: {} as WeeklyMetrics,
      generated_at: new Date().toISOString(),
      word_count: 100, // Below MIN_WORD_COUNT (150)
      sections_detected: ['Win', 'Watch', 'Pattern'] as const,
    };

    const { valid, issues } = validateNarrative(shortResult);
    expect(valid).toBe(false);
    expect(issues.some(i => i.includes('too low'))).toBe(true);
  });

  it('should flag narrative with too many words', () => {
    const longResult = {
      user_id: 'user-123',
      week_start: '2025-12-01',
      week_end: '2025-12-07',
      narrative: 'Long '.repeat(100), // 300 words
      metrics_snapshot: {} as WeeklyMetrics,
      generated_at: new Date().toISOString(),
      word_count: 300, // Above MAX_WORD_COUNT (250)
      sections_detected: ['Win', 'Watch', 'Pattern', 'Trajectory', 'Experiment'] as const,
    };

    const { valid, issues } = validateNarrative(longResult);
    expect(valid).toBe(false);
    expect(issues.some(i => i.includes('too high'))).toBe(true);
  });

  it('should flag narrative with too few sections', () => {
    const fewSectionsResult = {
      user_id: 'user-123',
      week_start: '2025-12-01',
      week_end: '2025-12-07',
      narrative: 'Word '.repeat(50),
      metrics_snapshot: {} as WeeklyMetrics,
      generated_at: new Date().toISOString(),
      word_count: 200,
      sections_detected: ['Win'] as const, // Only 1 section
    };

    const { valid, issues } = validateNarrative(fewSectionsResult);
    expect(valid).toBe(false);
    expect(issues.some(i => i.includes('sections'))).toBe(true);
  });
});
