/**
 * WakeDetector Unit Tests
 *
 * Tests for wake detection logic including:
 * - HealthKit sleep end detection
 * - Phone unlock detection with confirmation boost
 * - Manual wake reporting
 * - Nap detection (short sleep after noon)
 * - Early/late wake rejection
 * - Timezone handling
 * - Morning Anchor window calculation
 *
 * @file functions/src/__tests__/services/wake/WakeDetector.test.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WakeDetector, WakeDetectionInput } from '../../../src/services/wake/WakeDetector';

describe('WakeDetector', () => {
  let detector: WakeDetector;

  beforeEach(() => {
    detector = new WakeDetector();
  });

  // ==========================================================================
  // HEALTHKIT DETECTION
  // ==========================================================================

  describe('HealthKit detection', () => {
    it('detects wake from HealthKit sleep end time', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'America/New_York',
        sleepEndTime: new Date('2025-12-05T06:30:00-05:00'),
        sleepStartTime: new Date('2025-12-04T22:30:00-05:00'),
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(true);
      expect(result.method).toBe('hrv_spike');
      expect(result.confidence).toBe(0.95);
      expect(result.effectiveConfidence).toBe(0.95);
      expect(result.wakeTime).toEqual(input.sleepEndTime);
    });

    it('returns high confidence (0.95) for HealthKit', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepEndTime: new Date('2025-12-05T07:00:00Z'),
      };

      const result = detector.detect(input);

      expect(result.confidence).toBe(0.95);
    });

    it('rejects wake before 4am (too early)', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepEndTime: new Date('2025-12-05T03:30:00Z'), // 3:30 AM UTC
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.reason).toContain('too early');
    });

    it('rejects wake after 2pm (too late for morning)', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepEndTime: new Date('2025-12-05T15:00:00Z'), // 3 PM UTC
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.reason).toContain('too late');
    });

    it('detects nap and rejects (short sleep after noon)', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepStartTime: new Date('2025-12-05T13:00:00Z'), // 1 PM
        sleepEndTime: new Date('2025-12-05T13:45:00Z'), // 1:45 PM (45 min nap)
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.reason).toContain('nap');
    });

    it('accepts short sleep before noon (not a nap)', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepStartTime: new Date('2025-12-05T04:00:00Z'), // 4 AM
        sleepEndTime: new Date('2025-12-05T06:00:00Z'), // 6 AM (2 hours)
      };

      const result = detector.detect(input);

      // Short sleep before noon is allowed (might be early riser)
      expect(result.detected).toBe(true);
    });

    it('returns null wake time when not provided', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        // sleepEndTime not provided
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.reason).toContain('No sleep end time');
    });
  });

  // ==========================================================================
  // PHONE UNLOCK DETECTION
  // ==========================================================================

  describe('Phone unlock detection', () => {
    it('detects wake from phone unlock', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'phone_unlock',
        timezone: 'America/Los_Angeles',
        phoneUnlockTime: new Date('2025-12-05T07:00:00-08:00'),
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(true);
      expect(result.method).toBe('phone_unlock');
      expect(result.wakeTime).toEqual(input.phoneUnlockTime);
    });

    it('returns base confidence 0.60 for unconfirmed phone unlock', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'phone_unlock',
        timezone: 'UTC',
        phoneUnlockTime: new Date('2025-12-05T06:00:00Z'),
      };

      const result = detector.detect(input);

      expect(result.confidence).toBe(0.60);
      expect(result.effectiveConfidence).toBe(0.60);
    });

    it('boosts confidence to 0.85 when user confirms', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'phone_unlock',
        timezone: 'UTC',
        phoneUnlockTime: new Date('2025-12-05T06:00:00Z'),
        userConfirmedAt: new Date('2025-12-05T06:01:00Z'),
      };

      const result = detector.detect(input);

      expect(result.confidence).toBe(0.60); // Base confidence unchanged
      expect(result.effectiveConfidence).toBe(0.85); // Boosted by 0.25
    });

    it('rejects phone unlock before 4am', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'phone_unlock',
        timezone: 'UTC',
        phoneUnlockTime: new Date('2025-12-05T02:30:00Z'), // 2:30 AM
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.reason).toContain('too early');
    });

    it('rejects phone unlock after 2pm', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'phone_unlock',
        timezone: 'UTC',
        phoneUnlockTime: new Date('2025-12-05T16:00:00Z'), // 4 PM
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.reason).toContain('too late');
    });

    it('includes workday flag in source metrics', () => {
      // Test Monday (workday)
      const mondayInput: WakeDetectionInput = {
        userId: 'user-123',
        source: 'phone_unlock',
        timezone: 'UTC',
        phoneUnlockTime: new Date('2025-12-01T07:00:00Z'), // Monday
      };

      const mondayResult = detector.detect(mondayInput);
      expect(mondayResult.sourceMetrics).toBeDefined();
      expect((mondayResult.sourceMetrics as { isWorkday: boolean }).isWorkday).toBe(true);

      // Test Saturday (weekend)
      const saturdayInput: WakeDetectionInput = {
        userId: 'user-123',
        source: 'phone_unlock',
        timezone: 'UTC',
        phoneUnlockTime: new Date('2025-12-06T09:00:00Z'), // Saturday
      };

      const saturdayResult = detector.detect(saturdayInput);
      expect((saturdayResult.sourceMetrics as { isWorkday: boolean }).isWorkday).toBe(false);
    });
  });

  // ==========================================================================
  // MANUAL DETECTION
  // ==========================================================================

  describe('Manual wake reporting', () => {
    it('detects wake from manual report', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'manual',
        timezone: 'Europe/London',
        reportedWakeTime: new Date('2025-12-05T08:00:00Z'),
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(true);
      expect(result.method).toBe('manual');
    });

    it('returns confidence 0.70 for manual report', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'manual',
        timezone: 'UTC',
        reportedWakeTime: new Date('2025-12-05T07:30:00Z'),
      };

      const result = detector.detect(input);

      expect(result.confidence).toBe(0.70);
      expect(result.effectiveConfidence).toBe(0.70);
    });

    it('falls back to phoneUnlockTime if reportedWakeTime not provided', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'manual',
        timezone: 'UTC',
        phoneUnlockTime: new Date('2025-12-05T06:45:00Z'),
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(true);
      expect(result.wakeTime).toEqual(input.phoneUnlockTime);
    });
  });

  // ==========================================================================
  // MORNING ANCHOR WINDOW
  // ==========================================================================

  describe('Morning Anchor window', () => {
    it('calculates correct 5-15 minute window', () => {
      const wakeTime = new Date('2025-12-05T07:00:00Z');
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepEndTime: wakeTime,
      };

      const result = detector.detect(input);

      expect(result.morningAnchorWindow).toBeDefined();
      expect(result.morningAnchorWindow!.start.getTime()).toBe(
        wakeTime.getTime() + 5 * 60 * 1000 // 5 min after wake
      );
      expect(result.morningAnchorWindow!.end.getTime()).toBe(
        wakeTime.getTime() + 15 * 60 * 1000 // 15 min after wake
      );
    });

    it('calculates optimal trigger at 8 minutes', () => {
      const wakeTime = new Date('2025-12-05T06:30:00Z');
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepEndTime: wakeTime,
      };

      const result = detector.detect(input);

      expect(result.morningAnchorWindow!.optimal.getTime()).toBe(
        wakeTime.getTime() + 8 * 60 * 1000 // 8 min after wake
      );
    });

    it('sets shouldTriggerMorningAnchor to true when detected', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepEndTime: new Date('2025-12-05T07:00:00Z'),
      };

      const result = detector.detect(input);

      expect(result.shouldTriggerMorningAnchor).toBe(true);
    });
  });

  // ==========================================================================
  // TIMEZONE HANDLING
  // ==========================================================================

  describe('Timezone handling', () => {
    it('correctly interprets wake time in user timezone', () => {
      // 7 AM in New York = 12:00 UTC in December (EST = UTC-5)
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'America/New_York',
        sleepEndTime: new Date('2025-12-05T12:00:00Z'), // 7 AM EST
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(true);
    });

    it('rejects 3am local time even if UTC is valid', () => {
      // 3 AM in Tokyo = 6 PM UTC previous day
      // We should reject because local time is 3 AM
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'Asia/Tokyo',
        sleepEndTime: new Date('2025-12-04T18:00:00Z'), // 3 AM JST on Dec 5
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.reason).toContain('too early');
    });

    it('falls back to UTC for invalid timezone', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'Invalid/Timezone',
        sleepEndTime: new Date('2025-12-05T07:00:00Z'),
      };

      // Should still work with UTC fallback
      const result = detector.detect(input);
      expect(result.detected).toBe(true);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge cases', () => {
    it('handles unknown source gracefully', () => {
      const input = {
        userId: 'user-123',
        source: 'unknown_source' as 'healthkit',
        timezone: 'UTC',
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.reason).toContain('Unknown source');
    });

    it('returns proper no-detection result', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        // No sleepEndTime provided
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(false);
      expect(result.wakeTime).toBeNull();
      expect(result.method).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.effectiveConfidence).toBe(0);
      expect(result.shouldTriggerMorningAnchor).toBe(false);
      expect(result.morningAnchorWindow).toBeNull();
      expect(result.sourceMetrics).toBeNull();
    });

    it('handles exactly 4am boundary (should accept)', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepEndTime: new Date('2025-12-05T04:00:00Z'), // Exactly 4 AM
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(true);
    });

    it('handles exactly 2pm boundary (should accept)', () => {
      const input: WakeDetectionInput = {
        userId: 'user-123',
        source: 'healthkit',
        timezone: 'UTC',
        sleepEndTime: new Date('2025-12-05T14:00:00Z'), // Exactly 2 PM
      };

      const result = detector.detect(input);

      expect(result.detected).toBe(true);
    });
  });
});
