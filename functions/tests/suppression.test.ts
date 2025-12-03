/**
 * Suppression Engine Tests
 *
 * Tests all 9 suppression rules and override logic.
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  evaluateSuppression,
  buildSuppressionContext,
  getUserLocalHour,
  parseQuietHour,
} from '../src/suppression/suppressionEngine';
import { SUPPRESSION_RULES, simpleHash, getRuleById } from '../src/suppression/rules';
import {
  SuppressionContext,
  SUPPRESSION_CONFIG,
  RULE_IDS,
} from '../src/suppression/types';

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

/**
 * Helper to create a base suppression context
 */
function createBaseContext(overrides: Partial<SuppressionContext> = {}): SuppressionContext {
  return {
    nudgesDeliveredToday: 0,
    userLocalHour: 10, // 10am - mid-morning
    user: {
      quiet_hours_start: 22, // 10pm
      quiet_hours_end: 6, // 6am
    },
    lastNudgeDeliveredAt: null,
    dismissalsToday: 0,
    meetingHoursToday: 0,
    nudgePriority: 'STANDARD',
    confidenceScore: 0.75,
    recoveryScore: 80, // Good recovery
    isMorningAnchor: false,
    currentStreak: 0,
    mvdActive: false,
    isMvdApprovedNudge: false,
    ...overrides,
  };
}

describe('Suppression Engine', () => {
  describe('Rule Definitions', () => {
    it('should have exactly 9 rules', () => {
      expect(SUPPRESSION_RULES).toHaveLength(9);
    });

    it('should have rules sorted by priority', () => {
      for (let i = 1; i < SUPPRESSION_RULES.length; i++) {
        expect(SUPPRESSION_RULES[i].priority).toBeGreaterThan(
          SUPPRESSION_RULES[i - 1].priority
        );
      }
    });

    it('should be able to get a rule by ID', () => {
      const rule = getRuleById(RULE_IDS.DAILY_CAP);
      expect(rule).toBeDefined();
      expect(rule?.name).toBe('Daily Cap');
    });
  });

  describe('Rule 1: Daily Cap', () => {
    it('should allow nudges under the daily cap', () => {
      const context = createBaseContext({ nudgesDeliveredToday: 4 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress nudges at the daily cap', () => {
      const context = createBaseContext({ nudgesDeliveredToday: 5 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.DAILY_CAP);
    });

    it('should allow CRITICAL nudges to override daily cap', () => {
      const context = createBaseContext({
        nudgesDeliveredToday: 5,
        nudgePriority: 'CRITICAL',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
      expect(result.wasOverridden).toBe(true);
      expect(result.overriddenRule).toBe(RULE_IDS.DAILY_CAP);
    });
  });

  describe('Rule 2: Quiet Hours', () => {
    it('should allow nudges outside quiet hours', () => {
      const context = createBaseContext({ userLocalHour: 14 }); // 2pm
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress nudges during quiet hours (late night)', () => {
      const context = createBaseContext({ userLocalHour: 23 }); // 11pm
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.QUIET_HOURS);
    });

    it('should suppress nudges during quiet hours (early morning)', () => {
      const context = createBaseContext({ userLocalHour: 4 }); // 4am
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.QUIET_HOURS);
    });

    it('should NOT allow CRITICAL nudges to override quiet hours', () => {
      const context = createBaseContext({
        userLocalHour: 23,
        nudgePriority: 'CRITICAL',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.QUIET_HOURS);
    });

    it('should handle same-day quiet hours', () => {
      // Quiet hours 13:00-17:00 (afternoon quiet time)
      const context = createBaseContext({
        userLocalHour: 15,
        user: { quiet_hours_start: 13, quiet_hours_end: 17 },
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.QUIET_HOURS);
    });
  });

  describe('Rule 3: Cooldown Period', () => {
    it('should allow nudges when no previous nudge', () => {
      const context = createBaseContext({ lastNudgeDeliveredAt: null });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress nudges within cooldown period', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const context = createBaseContext({ lastNudgeDeliveredAt: oneHourAgo });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.COOLDOWN);
    });

    it('should allow nudges after cooldown period', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const context = createBaseContext({ lastNudgeDeliveredAt: threeHoursAgo });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should allow CRITICAL nudges to override cooldown', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const context = createBaseContext({
        lastNudgeDeliveredAt: oneHourAgo,
        nudgePriority: 'CRITICAL',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
      expect(result.wasOverridden).toBe(true);
    });
  });

  describe('Rule 4: Fatigue Detection', () => {
    it('should allow nudges with few dismissals', () => {
      const context = createBaseContext({ dismissalsToday: 2 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress nudges after 3+ dismissals', () => {
      const context = createBaseContext({ dismissalsToday: 3 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.FATIGUE_DETECTION);
    });

    it('should NOT allow any priority to override fatigue detection', () => {
      const context = createBaseContext({
        dismissalsToday: 3,
        nudgePriority: 'CRITICAL',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.FATIGUE_DETECTION);
    });
  });

  describe('Rule 5: Meeting Awareness', () => {
    it('should allow STANDARD nudges on light meeting days', () => {
      const context = createBaseContext({
        meetingHoursToday: 1,
        nudgePriority: 'STANDARD',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress STANDARD nudges on heavy meeting days', () => {
      const context = createBaseContext({
        meetingHoursToday: 3,
        nudgePriority: 'STANDARD',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.MEETING_AWARENESS);
    });

    it('should allow ADAPTIVE nudges on heavy meeting days', () => {
      const context = createBaseContext({
        meetingHoursToday: 3,
        nudgePriority: 'ADAPTIVE',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should allow CRITICAL nudges on heavy meeting days', () => {
      const context = createBaseContext({
        meetingHoursToday: 3,
        nudgePriority: 'CRITICAL',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });
  });

  describe('Rule 6: Low Recovery Mode', () => {
    it('should allow nudges when recovery is above threshold', () => {
      const context = createBaseContext({
        recoveryScore: 50,
        userLocalHour: 14, // afternoon
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress afternoon nudges when recovery is low', () => {
      const context = createBaseContext({
        recoveryScore: 25,
        userLocalHour: 14, // afternoon
        isMorningAnchor: false,
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.LOW_RECOVERY);
    });

    it('should allow morning nudges when recovery is low', () => {
      const context = createBaseContext({
        recoveryScore: 25,
        userLocalHour: 7, // morning (within 5-10am window)
        isMorningAnchor: false,
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should allow morning anchor protocols when recovery is low', () => {
      const context = createBaseContext({
        recoveryScore: 25,
        userLocalHour: 14, // afternoon
        isMorningAnchor: true, // Morning light protocol
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress at exactly threshold boundary', () => {
      const context = createBaseContext({
        recoveryScore: 29, // Just below 30%
        userLocalHour: 14,
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.LOW_RECOVERY);
    });

    it('should allow at exactly threshold boundary', () => {
      const context = createBaseContext({
        recoveryScore: 30, // Exactly at threshold
        userLocalHour: 14,
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });
  });

  describe('Rule 7: Streak Respect', () => {
    it('should allow nudges when streak is below threshold', () => {
      const context = createBaseContext({ currentStreak: 5 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should use deterministic hashing for streak suppression', () => {
      // Test that the same streak value produces consistent results
      const hash1 = simpleHash('2024-01-15-7');
      const hash2 = simpleHash('2024-01-15-7');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = simpleHash('2024-01-15-7');
      const hash2 = simpleHash('2024-01-16-7');
      expect(hash1).not.toBe(hash2);
    });

    it('should check streak respect rule exists', () => {
      const rule = getRuleById(RULE_IDS.STREAK_RESPECT);
      expect(rule).toBeDefined();
      expect(rule?.canBeOverridden).toBe(false);
    });
  });

  describe('Rule 8: Low Confidence Filter', () => {
    it('should allow nudges with high confidence', () => {
      const context = createBaseContext({ confidenceScore: 0.75 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress nudges with low confidence', () => {
      const context = createBaseContext({ confidenceScore: 0.35 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.LOW_CONFIDENCE);
    });

    it('should allow nudges at exactly threshold', () => {
      const context = createBaseContext({ confidenceScore: 0.4 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress nudges just below threshold', () => {
      const context = createBaseContext({ confidenceScore: 0.39 });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.LOW_CONFIDENCE);
    });
  });

  describe('Rule 9: MVD Active', () => {
    it('should allow all nudges when MVD is not active', () => {
      const context = createBaseContext({
        mvdActive: false,
        isMvdApprovedNudge: false,
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });

    it('should suppress non-MVD nudges when MVD is active', () => {
      const context = createBaseContext({
        mvdActive: true,
        isMvdApprovedNudge: false,
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.MVD_ACTIVE);
    });

    it('should allow MVD-approved nudges when MVD is active', () => {
      const context = createBaseContext({
        mvdActive: true,
        isMvdApprovedNudge: true,
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(true);
    });
  });

  describe('Multiple Rules Triggering', () => {
    it('should return the first suppressing rule (priority order)', () => {
      // Both daily_cap and quiet_hours would trigger, but quiet_hours should win (priority 2)
      // Wait, daily_cap is priority 1, so it should be checked first
      const context = createBaseContext({
        nudgesDeliveredToday: 6,
        userLocalHour: 23, // quiet hours
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.DAILY_CAP); // Priority 1
    });

    it('should check all rules in order', () => {
      const context = createBaseContext();
      const result = evaluateSuppression(context);
      expect(result.rulesChecked).toHaveLength(9);
      expect(result.rulesChecked[0]).toBe(RULE_IDS.DAILY_CAP);
      expect(result.rulesChecked[8]).toBe(RULE_IDS.MVD_ACTIVE);
    });
  });

  describe('Override Logic', () => {
    it('should track when an override is applied', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const context = createBaseContext({
        lastNudgeDeliveredAt: oneHourAgo,
        nudgePriority: 'CRITICAL',
      });
      const result = evaluateSuppression(context);
      expect(result.wasOverridden).toBe(true);
      expect(result.overriddenRule).toBe(RULE_IDS.COOLDOWN);
    });

    it('should not allow override on non-overridable rules', () => {
      const context = createBaseContext({
        dismissalsToday: 5,
        nudgePriority: 'CRITICAL',
      });
      const result = evaluateSuppression(context);
      expect(result.shouldDeliver).toBe(false);
      expect(result.suppressedBy).toBe(RULE_IDS.FATIGUE_DETECTION);
    });
  });

  describe('Helper Functions', () => {
    describe('buildSuppressionContext', () => {
      it('should use default quiet hours when not specified', () => {
        const context = buildSuppressionContext({
          nudgePriority: 'STANDARD',
          confidenceScore: 0.8,
          userLocalHour: 10,
          userPreferences: {},
          nudgesDeliveredToday: 0,
          lastNudgeDeliveredAt: null,
          dismissalsToday: 0,
          meetingHoursToday: 0,
        });
        expect(context.user.quiet_hours_start).toBe(SUPPRESSION_CONFIG.DEFAULT_QUIET_START);
        expect(context.user.quiet_hours_end).toBe(SUPPRESSION_CONFIG.DEFAULT_QUIET_END);
      });

      it('should use provided values over defaults', () => {
        const context = buildSuppressionContext({
          nudgePriority: 'STANDARD',
          confidenceScore: 0.8,
          userLocalHour: 10,
          userPreferences: {
            quiet_hours_start: 21,
            quiet_hours_end: 7,
          },
          nudgesDeliveredToday: 0,
          lastNudgeDeliveredAt: null,
          dismissalsToday: 0,
          meetingHoursToday: 0,
        });
        expect(context.user.quiet_hours_start).toBe(21);
        expect(context.user.quiet_hours_end).toBe(7);
      });

      it('should default new fields to safe values', () => {
        const context = buildSuppressionContext({
          nudgePriority: 'STANDARD',
          confidenceScore: 0.8,
          userLocalHour: 10,
          userPreferences: {},
          nudgesDeliveredToday: 0,
          lastNudgeDeliveredAt: null,
          dismissalsToday: 0,
          meetingHoursToday: 0,
          // Not providing Part 2 fields
        });
        expect(context.recoveryScore).toBe(100); // Default to healthy
        expect(context.isMorningAnchor).toBe(false);
        expect(context.currentStreak).toBe(0);
        expect(context.mvdActive).toBe(false);
        expect(context.isMvdApprovedNudge).toBe(false);
      });
    });

    describe('getUserLocalHour', () => {
      it('should return UTC hour when no timezone', () => {
        const date = new Date('2024-01-15T14:30:00Z');
        expect(getUserLocalHour(date)).toBe(14);
      });

      it('should convert to local hour with timezone', () => {
        const date = new Date('2024-01-15T14:30:00Z');
        const hour = getUserLocalHour(date, 'America/New_York');
        // New York is UTC-5 in January
        expect(hour).toBe(9);
      });

      it('should handle invalid timezone gracefully', () => {
        const date = new Date('2024-01-15T14:30:00Z');
        const hour = getUserLocalHour(date, 'Invalid/Timezone');
        expect(hour).toBe(14); // Falls back to UTC
      });
    });

    describe('parseQuietHour', () => {
      it('should parse valid time string', () => {
        expect(parseQuietHour('22:00')).toBe(22);
        expect(parseQuietHour('06:30')).toBe(6);
        expect(parseQuietHour('0:00')).toBe(0);
      });

      it('should return undefined for invalid input', () => {
        expect(parseQuietHour(undefined)).toBeUndefined();
        expect(parseQuietHour('')).toBeUndefined();
        expect(parseQuietHour('invalid')).toBeUndefined();
        expect(parseQuietHour('25:00')).toBeUndefined(); // Invalid hour
      });
    });
  });

  describe('Config Values', () => {
    it('should have correct configuration values', () => {
      expect(SUPPRESSION_CONFIG.DAILY_CAP).toBe(5);
      expect(SUPPRESSION_CONFIG.COOLDOWN_MS).toBe(2 * 60 * 60 * 1000);
      expect(SUPPRESSION_CONFIG.FATIGUE_THRESHOLD).toBe(3);
      expect(SUPPRESSION_CONFIG.MEETING_HOURS_THRESHOLD).toBe(2);
      expect(SUPPRESSION_CONFIG.LOW_RECOVERY_THRESHOLD).toBe(30);
      expect(SUPPRESSION_CONFIG.STREAK_THRESHOLD).toBe(7);
      expect(SUPPRESSION_CONFIG.LOW_CONFIDENCE_THRESHOLD).toBe(0.4);
      expect(SUPPRESSION_CONFIG.MORNING_HOURS_START).toBe(5);
      expect(SUPPRESSION_CONFIG.MORNING_HOURS_END).toBe(10);
    });
  });
});
