/**
 * MVD Detector Unit Tests
 *
 * Tests for MVD detection logic, protocol filtering, and exit conditions.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectMVD,
  shouldExitMVD,
  selectMVDType,
} from '../src/mvd/mvdDetector';
import {
  isProtocolApprovedForMVD,
  getMVDProtocolCount,
  getMVDTypeDescription,
  getApprovedProtocolIds,
  getAllMVDApprovedProtocolIds,
  MVD_PROTOCOL_SETS,
} from '../src/mvd/mvdProtocols';
import { MVDDetectionContext, MVD_CONFIG } from '../src/mvd/types';

// Helper to create a base context
function createBaseContext(
  overrides: Partial<MVDDetectionContext> = {}
): MVDDetectionContext {
  return {
    userId: 'test-user-123',
    recoveryScore: 75, // Healthy default
    userTimezone: 'America/New_York',
    deviceTimezone: 'America/New_York', // Same timezone (no travel)
    completionHistory: [80, 85, 90], // Healthy completion rates
    isManualActivation: false,
    ...overrides,
  };
}

describe('MVD Detector', () => {
  describe('detectMVD', () => {
    describe('manual activation', () => {
      it('should activate full MVD on manual activation', () => {
        const context = createBaseContext({ isManualActivation: true });
        const result = detectMVD(context);

        expect(result.shouldActivate).toBe(true);
        expect(result.trigger).toBe('manual_activation');
        expect(result.mvdType).toBe('full');
        expect(result.exitCondition).toContain('50%');
      });

      it('should prioritize manual activation over other triggers', () => {
        const context = createBaseContext({
          isManualActivation: true,
          recoveryScore: 20, // Would trigger low_recovery
        });
        const result = detectMVD(context);

        expect(result.trigger).toBe('manual_activation');
      });
    });

    describe('low recovery trigger', () => {
      it('should activate full MVD when recovery < 35%', () => {
        const context = createBaseContext({
          recoveryScore: 30,
        });
        const result = detectMVD(context);

        expect(result.shouldActivate).toBe(true);
        expect(result.trigger).toBe('low_recovery');
        expect(result.mvdType).toBe('full');
        expect(result.reason).toContain('30%');
      });

      it('should not activate when recovery is exactly 35%', () => {
        const context = createBaseContext({
          recoveryScore: 35,
        });
        const result = detectMVD(context);

        expect(result.shouldActivate).toBe(false);
      });

      it('should not activate when recovery is above threshold', () => {
        const context = createBaseContext({
          recoveryScore: 60,
        });
        const result = detectMVD(context);

        expect(result.shouldActivate).toBe(false);
      });

      it('should not activate when recovery is null', () => {
        const context = createBaseContext({
          recoveryScore: null,
        });
        const result = detectMVD(context);

        // Null recovery alone should not trigger MVD
        expect(result.trigger).not.toBe('low_recovery');
      });
    });

    describe('travel detection trigger', () => {
      it('should activate travel MVD when timezone offset > 2h', () => {
        const context = createBaseContext({
          userTimezone: 'America/New_York', // UTC-5
          deviceTimezone: 'America/Los_Angeles', // UTC-8
        });
        const result = detectMVD(context);

        expect(result.shouldActivate).toBe(true);
        expect(result.trigger).toBe('travel_detected');
        expect(result.mvdType).toBe('travel');
      });

      it('should not activate when timezone offset <= 2h', () => {
        const context = createBaseContext({
          userTimezone: 'America/New_York',
          deviceTimezone: 'America/Chicago', // Only 1h difference
        });
        const result = detectMVD(context);

        expect(result.trigger).not.toBe('travel_detected');
      });

      it('should not activate when timezones are the same', () => {
        const context = createBaseContext({
          userTimezone: 'America/New_York',
          deviceTimezone: 'America/New_York',
        });
        const result = detectMVD(context);

        expect(result.trigger).not.toBe('travel_detected');
      });

      it('should handle null timezones gracefully', () => {
        const context = createBaseContext({
          userTimezone: null,
          deviceTimezone: 'America/Los_Angeles',
        });
        const result = detectMVD(context);

        expect(result.trigger).not.toBe('travel_detected');
      });

      it('should prioritize travel over low_recovery', () => {
        const context = createBaseContext({
          recoveryScore: 20, // Would trigger low_recovery
          userTimezone: 'America/New_York',
          deviceTimezone: 'America/Los_Angeles', // Travel
        });
        const result = detectMVD(context);

        expect(result.trigger).toBe('travel_detected');
        expect(result.mvdType).toBe('travel');
      });
    });

    describe('consistency drop trigger', () => {
      it('should activate semi_active MVD when 3+ days below 50%', () => {
        const context = createBaseContext({
          completionHistory: [40, 35, 45], // All below 50%
        });
        const result = detectMVD(context);

        expect(result.shouldActivate).toBe(true);
        expect(result.trigger).toBe('consistency_drop');
        expect(result.mvdType).toBe('semi_active');
      });

      it('should not activate if any day is above 50%', () => {
        const context = createBaseContext({
          completionHistory: [40, 55, 45], // One day above
        });
        const result = detectMVD(context);

        expect(result.trigger).not.toBe('consistency_drop');
      });

      it('should not activate with insufficient data', () => {
        const context = createBaseContext({
          completionHistory: [40, 35], // Only 2 days
        });
        const result = detectMVD(context);

        expect(result.trigger).not.toBe('consistency_drop');
      });

      it('should handle empty completion history', () => {
        const context = createBaseContext({
          completionHistory: [],
        });
        const result = detectMVD(context);

        expect(result.trigger).not.toBe('consistency_drop');
      });

      it('should have lower priority than low_recovery', () => {
        const context = createBaseContext({
          recoveryScore: 20, // Would trigger low_recovery
          completionHistory: [40, 35, 45], // Would trigger consistency_drop
        });
        const result = detectMVD(context);

        expect(result.trigger).toBe('low_recovery');
        expect(result.mvdType).toBe('full');
      });
    });

    describe('no triggers', () => {
      it('should not activate with healthy metrics', () => {
        const context = createBaseContext({
          recoveryScore: 75,
          completionHistory: [80, 85, 90],
        });
        const result = detectMVD(context);

        expect(result.shouldActivate).toBe(false);
        expect(result.trigger).toBeNull();
        expect(result.mvdType).toBeNull();
      });
    });
  });

  describe('shouldExitMVD', () => {
    it('should exit when recovery > 50%', () => {
      expect(shouldExitMVD(55)).toBe(true);
      expect(shouldExitMVD(75)).toBe(true);
      expect(shouldExitMVD(100)).toBe(true);
    });

    it('should not exit when recovery <= 50%', () => {
      expect(shouldExitMVD(50)).toBe(false);
      expect(shouldExitMVD(45)).toBe(false);
      expect(shouldExitMVD(30)).toBe(false);
    });

    it('should not exit when recovery is null', () => {
      expect(shouldExitMVD(null)).toBe(false);
    });

    it('should exit at 51%', () => {
      expect(shouldExitMVD(51)).toBe(true);
    });
  });

  describe('selectMVDType', () => {
    it('should return travel for travel_detected', () => {
      expect(selectMVDType('travel_detected')).toBe('travel');
    });

    it('should return full for low_recovery', () => {
      expect(selectMVDType('low_recovery')).toBe('full');
    });

    it('should return full for manual_activation', () => {
      expect(selectMVDType('manual_activation')).toBe('full');
    });

    it('should return semi_active for consistency_drop', () => {
      expect(selectMVDType('consistency_drop')).toBe('semi_active');
    });
  });
});

describe('MVD Protocol Sets', () => {
  describe('isProtocolApprovedForMVD', () => {
    describe('full MVD', () => {
      it('should approve morning light', () => {
        expect(isProtocolApprovedForMVD('morning_light_exposure', 'full')).toBe(true);
        expect(isProtocolApprovedForMVD('proto_morning_light', 'full')).toBe(true);
      });

      it('should approve hydration', () => {
        expect(isProtocolApprovedForMVD('hydration_electrolytes', 'full')).toBe(true);
      });

      it('should approve sleep optimization', () => {
        expect(isProtocolApprovedForMVD('sleep_optimization', 'full')).toBe(true);
      });

      it('should NOT approve walking breaks in full', () => {
        expect(isProtocolApprovedForMVD('walking_breaks', 'full')).toBe(false);
      });

      it('should NOT approve caffeine timing in full', () => {
        expect(isProtocolApprovedForMVD('caffeine_timing', 'full')).toBe(false);
      });
    });

    describe('semi_active MVD', () => {
      it('should approve all full protocols', () => {
        expect(isProtocolApprovedForMVD('morning_light_exposure', 'semi_active')).toBe(true);
        expect(isProtocolApprovedForMVD('hydration_electrolytes', 'semi_active')).toBe(true);
        expect(isProtocolApprovedForMVD('sleep_optimization', 'semi_active')).toBe(true);
      });

      it('should approve walking breaks', () => {
        expect(isProtocolApprovedForMVD('walking_breaks', 'semi_active')).toBe(true);
      });

      it('should approve evening light', () => {
        expect(isProtocolApprovedForMVD('evening_light_management', 'semi_active')).toBe(true);
      });

      it('should NOT approve caffeine timing in semi_active', () => {
        expect(isProtocolApprovedForMVD('caffeine_timing', 'semi_active')).toBe(false);
      });
    });

    describe('travel MVD', () => {
      it('should approve morning light', () => {
        expect(isProtocolApprovedForMVD('morning_light_exposure', 'travel')).toBe(true);
      });

      it('should approve caffeine timing', () => {
        expect(isProtocolApprovedForMVD('caffeine_timing', 'travel')).toBe(true);
      });

      it('should approve evening light', () => {
        expect(isProtocolApprovedForMVD('evening_light_management', 'travel')).toBe(true);
      });

      it('should NOT approve walking breaks in travel', () => {
        expect(isProtocolApprovedForMVD('walking_breaks', 'travel')).toBe(false);
      });

      it('should NOT approve sleep optimization in travel', () => {
        expect(isProtocolApprovedForMVD('sleep_optimization', 'travel')).toBe(false);
      });
    });

    describe('null MVD type', () => {
      it('should approve all protocols when MVD is not active', () => {
        expect(isProtocolApprovedForMVD('walking_breaks', null)).toBe(true);
        expect(isProtocolApprovedForMVD('caffeine_timing', null)).toBe(true);
        expect(isProtocolApprovedForMVD('some_random_protocol', null)).toBe(true);
      });
    });

    describe('case insensitivity', () => {
      it('should match protocols case-insensitively', () => {
        expect(isProtocolApprovedForMVD('MORNING_LIGHT_EXPOSURE', 'full')).toBe(true);
        expect(isProtocolApprovedForMVD('Morning_Light_Exposure', 'full')).toBe(true);
      });
    });
  });

  describe('getMVDProtocolCount', () => {
    // Note: Count is based on unique base names after removing 'proto_' prefix
    // The protocol sets have dual naming (proto_X and X variants)
    it('should return correct count for full MVD', () => {
      // Full: morning_light, morning_light_exposure, hydration_electrolytes, sleep_optimization = 4 unique base names
      expect(getMVDProtocolCount('full')).toBeGreaterThanOrEqual(3);
      expect(getMVDProtocolCount('full')).toBeLessThanOrEqual(6);
    });

    it('should have more protocols in semi_active than full', () => {
      expect(getMVDProtocolCount('semi_active')).toBeGreaterThan(
        getMVDProtocolCount('full')
      );
    });

    it('should return positive count for travel MVD', () => {
      expect(getMVDProtocolCount('travel')).toBeGreaterThan(0);
    });
  });

  describe('getMVDTypeDescription', () => {
    it('should return descriptions for all types', () => {
      expect(getMVDTypeDescription('full')).toContain('essentials');
      expect(getMVDTypeDescription('semi_active')).toContain('walking');
      expect(getMVDTypeDescription('travel')).toContain('Circadian');
    });
  });

  describe('getApprovedProtocolIds', () => {
    it('should return protocol arrays for each type', () => {
      expect(getApprovedProtocolIds('full').length).toBeGreaterThan(0);
      expect(getApprovedProtocolIds('semi_active').length).toBeGreaterThan(0);
      expect(getApprovedProtocolIds('travel').length).toBeGreaterThan(0);
    });

    it('should have semi_active > full protocols', () => {
      expect(getApprovedProtocolIds('semi_active').length).toBeGreaterThan(
        getApprovedProtocolIds('full').length
      );
    });
  });

  describe('getAllMVDApprovedProtocolIds', () => {
    it('should return unique protocols across all types', () => {
      const allProtocols = getAllMVDApprovedProtocolIds();
      const uniqueProtocols = new Set(allProtocols);
      expect(allProtocols.length).toBe(uniqueProtocols.size);
    });

    it('should include protocols from all types', () => {
      const allProtocols = getAllMVDApprovedProtocolIds();
      // Morning light should be in all
      expect(allProtocols.some(p => p.includes('morning_light'))).toBe(true);
      // Caffeine is only in travel
      expect(allProtocols.some(p => p.includes('caffeine'))).toBe(true);
    });
  });
});

describe('MVD Configuration', () => {
  it('should have correct threshold values', () => {
    expect(MVD_CONFIG.LOW_RECOVERY_THRESHOLD).toBe(35);
    expect(MVD_CONFIG.RECOVERY_EXIT_THRESHOLD).toBe(50);
    expect(MVD_CONFIG.TRAVEL_TIMEZONE_THRESHOLD).toBe(2);
    expect(MVD_CONFIG.CONSISTENCY_THRESHOLD).toBe(50);
    expect(MVD_CONFIG.CONSISTENCY_DAYS).toBe(3);
  });
});
