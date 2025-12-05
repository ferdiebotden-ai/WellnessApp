/**
 * Check-in Score Service Tests
 *
 * Unit tests for the manual check-in score calculator.
 * Tests cover rating conversion, duration scoring, component building,
 * recommendations, reasoning generation, and full score calculation.
 *
 * @file functions/tests/checkInScore.test.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */

import { describe, expect, it } from 'vitest';
import {
  ratingToScore,
  calculateSleepDurationScore,
  buildComponents,
  generateRecommendations,
  generateReasoning,
  calculateCheckInScore,
  validateCheckInInput,
} from '../src/services/checkInScore';
import type { ManualCheckInInput, QualityRating } from '../src/types/checkIn.types';
import { CHECK_IN_WEIGHTS, MAX_CHECK_IN_CONFIDENCE, SKIPPED_CHECK_IN_CONFIDENCE } from '../src/types/checkIn.types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Create a valid check-in input for testing.
 */
function createCheckInInput(overrides: Partial<ManualCheckInInput> = {}): ManualCheckInInput {
  return {
    sleepQuality: 4,
    sleepHours: '7-8',
    energyLevel: 3,
    ...overrides,
  };
}

// =============================================================================
// RATING TO SCORE CONVERSION
// =============================================================================

describe('ratingToScore', () => {
  it('should convert rating 1 to score 20', () => {
    expect(ratingToScore(1)).toBe(20);
  });

  it('should convert rating 2 to score 40', () => {
    expect(ratingToScore(2)).toBe(40);
  });

  it('should convert rating 3 to score 60', () => {
    expect(ratingToScore(3)).toBe(60);
  });

  it('should convert rating 4 to score 80', () => {
    expect(ratingToScore(4)).toBe(80);
  });

  it('should convert rating 5 to score 100', () => {
    expect(ratingToScore(5)).toBe(100);
  });
});

// =============================================================================
// SLEEP DURATION SCORING
// =============================================================================

describe('calculateSleepDurationScore', () => {
  it('should return 100 for exactly hitting target (7.5h)', () => {
    const result = calculateSleepDurationScore(7.5, 7.5);
    expect(result.score).toBe(100);
    expect(result.vsTarget).toBe('On target');
  });

  it('should return 100 for being within 15 minutes of target', () => {
    const result = calculateSleepDurationScore(7.4, 7.5);
    expect(result.score).toBe(100);
    expect(result.vsTarget).toBe('On target');
  });

  it('should penalize under-sleeping by 15 points per hour', () => {
    // 6.5h is 1h under 7.5h target => 100 - 15 = 85
    const result = calculateSleepDurationScore(6.5, 7.5);
    expect(result.score).toBe(85);
    expect(result.vsTarget).toContain('-1.0h');
  });

  it('should have minimum score of 20 for severe under-sleeping', () => {
    // 3h sleep is 4.5h under target: 100 - (4.5 * 15) = 32.5
    // Floor is 20, but 3h still doesn't hit it
    const result = calculateSleepDurationScore(3, 7.5);
    expect(result.score).toBe(33); // 100 - 67.5 = 32.5 -> rounds to 33

    // Need more extreme undersleep to hit floor
    const extreme = calculateSleepDurationScore(1, 7.5); // 6.5h under
    expect(extreme.score).toBe(20); // hits floor
  });

  it('should penalize over-sleeping by 5 points per hour', () => {
    // 9.5h is 2h over 7.5h target => 100 - 10 = 90
    const result = calculateSleepDurationScore(9.5, 7.5);
    expect(result.score).toBe(90);
    expect(result.vsTarget).toContain('+2.0h');
  });

  it('should have minimum score of 70 for over-sleeping', () => {
    // 13.5h sleep (6h over) should hit the floor for oversleep
    const result = calculateSleepDurationScore(13.5, 7.5);
    expect(result.score).toBe(70);
  });

  it('should format negative difference correctly', () => {
    const result = calculateSleepDurationScore(6, 7.5);
    expect(result.vsTarget).toBe('-1.5h from target');
  });

  it('should format positive difference correctly', () => {
    const result = calculateSleepDurationScore(8.5, 7.5);
    expect(result.vsTarget).toBe('+1.0h over target');
  });
});

// =============================================================================
// COMPONENT BUILDING
// =============================================================================

describe('buildComponents', () => {
  it('should build components from valid input', () => {
    const input = createCheckInInput({
      sleepQuality: 5,
      sleepHours: '8+',
      energyLevel: 4,
    });

    const components = buildComponents(input);

    expect(components.sleepQuality.rating).toBe(5);
    expect(components.sleepQuality.score).toBe(100);
    expect(components.sleepQuality.label).toBe('Great');
    expect(components.sleepQuality.weight).toBe(0.40);

    expect(components.sleepDuration.hours).toBe(8.5); // '8+' maps to 8.5
    expect(components.sleepDuration.option).toBe('8+');
    expect(components.sleepDuration.weight).toBe(0.35);

    expect(components.energyLevel.rating).toBe(4);
    expect(components.energyLevel.score).toBe(80);
    expect(components.energyLevel.label).toBe('Good');
    expect(components.energyLevel.weight).toBe(0.25);
  });

  it('should map sleep hours options correctly', () => {
    const hoursMap: Array<{ option: ManualCheckInInput['sleepHours']; expected: number }> = [
      { option: '<5', expected: 4.5 },
      { option: '5-6', expected: 5.5 },
      { option: '6-7', expected: 6.5 },
      { option: '7-8', expected: 7.5 },
      { option: '8+', expected: 8.5 },
    ];

    for (const { option, expected } of hoursMap) {
      const input = createCheckInInput({ sleepHours: option });
      const components = buildComponents(input);
      expect(components.sleepDuration.hours).toBe(expected);
    }
  });

  it('should apply correct labels for all ratings', () => {
    const qualityLabels: Record<QualityRating, string> = {
      1: 'Poor',
      2: 'Fair',
      3: 'Okay',
      4: 'Good',
      5: 'Great',
    };

    const energyLabels: Record<QualityRating, string> = {
      1: 'Exhausted',
      2: 'Low',
      3: 'Moderate',
      4: 'Good',
      5: 'Energized',
    };

    for (const rating of [1, 2, 3, 4, 5] as QualityRating[]) {
      const input = createCheckInInput({ sleepQuality: rating, energyLevel: rating });
      const components = buildComponents(input);
      expect(components.sleepQuality.label).toBe(qualityLabels[rating]);
      expect(components.energyLevel.label).toBe(energyLabels[rating]);
    }
  });
});

// =============================================================================
// RECOMMENDATIONS GENERATION
// =============================================================================

describe('generateRecommendations', () => {
  it('should recommend high intensity training for green zone', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 5,
      sleepHours: '7-8',
      energyLevel: 5,
    }));

    const recommendations = generateRecommendations('green', components);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].type).toBe('training');
    expect(recommendations[0].headline).toContain('Green light');
    expect(recommendations[0].protocols).toContain('high_intensity_training');
  });

  it('should recommend moderate activity for yellow zone', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 3,
      sleepHours: '6-7',
      energyLevel: 3,
    }));

    const recommendations = generateRecommendations('yellow', components);

    expect(recommendations[0].type).toBe('recovery');
    expect(recommendations[0].headline).toContain('Moderate');
  });

  it('should add sleep advice for yellow zone with low sleep quality', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 2, // Poor = 40 points
      sleepHours: '6-7',
      energyLevel: 3,
    }));

    const recommendations = generateRecommendations('yellow', components);

    const sleepRec = recommendations.find((r) => r.headline.includes('Sleep quality'));
    expect(sleepRec).toBeDefined();
    expect(sleepRec?.type).toBe('rest');
    expect(sleepRec?.protocols).toContain('nap_protocol');
  });

  it('should add energy advice for yellow zone with low energy', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 3,
      sleepHours: '7-8',
      energyLevel: 2, // Tired = 40 points
    }));

    const recommendations = generateRecommendations('yellow', components);

    const energyRec = recommendations.find((r) => r.headline.includes('Energy'));
    expect(energyRec).toBeDefined();
    expect(energyRec?.type).toBe('health');
    expect(energyRec?.protocols).toContain('morning_sunlight');
  });

  it('should recommend rest for red zone', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 1,
      sleepHours: '<5',
      energyLevel: 1,
    }));

    const recommendations = generateRecommendations('red', components);

    expect(recommendations[0].type).toBe('rest');
    expect(recommendations[0].headline).toContain('recovery');
    expect(recommendations[0].protocols).toContain('rest_day');
  });

  it('should add sleep deficit advice for red zone with low duration', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 2,
      sleepHours: '<5', // 4.5h -> score ~55
      energyLevel: 2,
    }));

    const recommendations = generateRecommendations('red', components);

    const deficitRec = recommendations.find((r) => r.headline.includes('deficit'));
    expect(deficitRec).toBeDefined();
    expect(deficitRec?.protocols).toContain('early_bedtime');
  });
});

// =============================================================================
// REASONING GENERATION
// =============================================================================

describe('generateReasoning', () => {
  it('should generate skipped message when skipped', () => {
    const components = buildComponents(createCheckInInput());
    const reasoning = generateReasoning(60, 'yellow', components, true);

    expect(reasoning).toContain('skipped');
    expect(reasoning).toContain('default');
  });

  it('should lead with good readiness for green zone', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 5,
      energyLevel: 5,
    }));

    const reasoning = generateReasoning(80, 'green', components, false);
    expect(reasoning).toContain('Good readiness');
  });

  it('should lead with moderate readiness for yellow zone', () => {
    const components = buildComponents(createCheckInInput());
    const reasoning = generateReasoning(55, 'yellow', components, false);
    expect(reasoning).toContain('Moderate readiness');
  });

  it('should lead with low readiness for red zone', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 1,
      energyLevel: 1,
    }));

    const reasoning = generateReasoning(25, 'red', components, false);
    expect(reasoning).toContain('Low readiness');
  });

  it('should mention excellent sleep quality when score >= 80', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 4, // 80 points
    }));

    const reasoning = generateReasoning(70, 'green', components, false);
    expect(reasoning.toLowerCase()).toContain('good');
  });

  it('should note low sleep quality when score <= 40', () => {
    const components = buildComponents(createCheckInInput({
      sleepQuality: 2, // 40 points
    }));

    const reasoning = generateReasoning(40, 'yellow', components, false);
    expect(reasoning.toLowerCase()).toContain('fair'); // Label for rating 2
  });

  it('should note high energy when score >= 80', () => {
    const components = buildComponents(createCheckInInput({
      energyLevel: 5, // 100 points
    }));

    const reasoning = generateReasoning(75, 'green', components, false);
    expect(reasoning.toLowerCase()).toContain('energized');
  });

  it('should note low energy when score <= 40', () => {
    const components = buildComponents(createCheckInInput({
      energyLevel: 2, // 40 points
    }));

    const reasoning = generateReasoning(45, 'yellow', components, false);
    expect(reasoning.toLowerCase()).toContain('low'); // Label for rating 2
  });
});

// =============================================================================
// FULL SCORE CALCULATION
// =============================================================================

describe('calculateCheckInScore', () => {
  it('should calculate complete check-in score', () => {
    const input = createCheckInInput({
      sleepQuality: 4, // 80 points
      sleepHours: '7-8', // 100 points
      energyLevel: 3, // 60 points
    });

    const result = calculateCheckInScore(input);

    // Expected: (80 * 0.40) + (100 * 0.35) + (60 * 0.25) = 32 + 35 + 15 = 82
    expect(result.score).toBe(82);
    expect(result.zone).toBe('green');
    expect(result.confidence).toBe(MAX_CHECK_IN_CONFIDENCE);
    expect(result.isLiteMode).toBe(true);
    expect(result.skipped).toBe(false);
  });

  it('should return green zone for high scores (>= 67)', () => {
    const input = createCheckInInput({
      sleepQuality: 5, // 100
      sleepHours: '8+', // 100
      energyLevel: 4, // 80
    });

    const result = calculateCheckInScore(input);
    expect(result.zone).toBe('green');
    expect(result.score).toBeGreaterThanOrEqual(67);
  });

  it('should return yellow zone for moderate scores (34-66)', () => {
    const input = createCheckInInput({
      sleepQuality: 3, // 60
      sleepHours: '6-7', // ~85
      energyLevel: 2, // 40
    });

    const result = calculateCheckInScore(input);
    expect(result.zone).toBe('yellow');
    expect(result.score).toBeGreaterThanOrEqual(34);
    expect(result.score).toBeLessThanOrEqual(66);
  });

  it('should return red zone for low scores (<= 33)', () => {
    const input = createCheckInInput({
      sleepQuality: 1, // 20
      sleepHours: '<5', // ~55
      energyLevel: 1, // 20
    });

    const result = calculateCheckInScore(input);
    expect(result.zone).toBe('red');
    expect(result.score).toBeLessThanOrEqual(33);
  });

  it('should use default values when skipped', () => {
    const result = calculateCheckInScore(undefined, true);

    expect(result.skipped).toBe(true);
    expect(result.confidence).toBe(SKIPPED_CHECK_IN_CONFIDENCE);
    // Default: sleepQuality=3 (60), sleepHours='7-8' (100), energyLevel=3 (60)
    // Score: (60 * 0.40) + (100 * 0.35) + (60 * 0.25) = 24 + 35 + 15 = 74
    expect(result.score).toBe(74);
  });

  it('should return lower confidence when skipped', () => {
    const skippedResult = calculateCheckInScore(undefined, true);
    const normalResult = calculateCheckInScore(createCheckInInput(), false);

    expect(skippedResult.confidence).toBeLessThan(normalResult.confidence);
    expect(skippedResult.confidence).toBe(SKIPPED_CHECK_IN_CONFIDENCE);
    expect(normalResult.confidence).toBe(MAX_CHECK_IN_CONFIDENCE);
  });

  it('should include reasoning in result', () => {
    const result = calculateCheckInScore(createCheckInInput());

    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it('should include recommendations in result', () => {
    const result = calculateCheckInScore(createCheckInInput());

    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should include component breakdown in result', () => {
    const input = createCheckInInput();
    const result = calculateCheckInScore(input);

    expect(result.components.sleepQuality.rating).toBe(input.sleepQuality);
    expect(result.components.sleepDuration.option).toBe(input.sleepHours);
    expect(result.components.energyLevel.rating).toBe(input.energyLevel);
  });

  it('should verify weights sum to 1.0', () => {
    const total = CHECK_IN_WEIGHTS.sleepQuality + CHECK_IN_WEIGHTS.sleepDuration + CHECK_IN_WEIGHTS.energyLevel;
    expect(total).toBeCloseTo(1.0, 5);
  });
});

// =============================================================================
// ZONE BOUNDARY CONDITIONS
// =============================================================================

describe('Zone Boundaries', () => {
  it('should classify score 33 as red zone', () => {
    // Engineering inputs to get exactly around 33
    const input = createCheckInInput({
      sleepQuality: 1, // 20
      sleepHours: '<5', // ~55 (4.5h vs 7.5h target)
      energyLevel: 1, // 20
    });

    const result = calculateCheckInScore(input);
    // (20 * 0.40) + (55 * 0.35) + (20 * 0.25) = 8 + 19.25 + 5 = 32.25 ≈ 32
    expect(result.zone).toBe('red');
  });

  it('should classify score 67 as green zone', () => {
    const input = createCheckInInput({
      sleepQuality: 4, // 80
      sleepHours: '6-7', // ~85
      energyLevel: 3, // 60
    });

    const result = calculateCheckInScore(input);
    // (80 * 0.40) + (85 * 0.35) + (60 * 0.25) = 32 + 29.75 + 15 = 76.75 ≈ 77
    expect(result.zone).toBe('green');
  });
});

// =============================================================================
// INPUT VALIDATION
// =============================================================================

describe('validateCheckInInput', () => {
  it('should return null for valid input', () => {
    const input = createCheckInInput();
    expect(validateCheckInInput(input)).toBeNull();
  });

  it('should reject non-object input', () => {
    expect(validateCheckInInput(null)).toContain('Invalid input');
    expect(validateCheckInInput(undefined)).toContain('Invalid input');
    expect(validateCheckInInput('string')).toContain('Invalid input');
    expect(validateCheckInInput(123)).toContain('Invalid input');
  });

  it('should reject invalid sleepQuality', () => {
    expect(validateCheckInInput({ ...createCheckInInput(), sleepQuality: 0 })).toContain('sleepQuality');
    expect(validateCheckInInput({ ...createCheckInInput(), sleepQuality: 6 })).toContain('sleepQuality');
    expect(validateCheckInInput({ ...createCheckInInput(), sleepQuality: 'good' })).toContain('sleepQuality');
  });

  it('should reject invalid energyLevel', () => {
    expect(validateCheckInInput({ ...createCheckInInput(), energyLevel: 0 })).toContain('energyLevel');
    expect(validateCheckInInput({ ...createCheckInInput(), energyLevel: 6 })).toContain('energyLevel');
    expect(validateCheckInInput({ ...createCheckInInput(), energyLevel: 'high' })).toContain('energyLevel');
  });

  it('should reject invalid sleepHours', () => {
    expect(validateCheckInInput({ ...createCheckInInput(), sleepHours: '9+' })).toContain('sleepHours');
    expect(validateCheckInInput({ ...createCheckInInput(), sleepHours: 7 })).toContain('sleepHours');
    expect(validateCheckInInput({ ...createCheckInInput(), sleepHours: 'lots' })).toContain('sleepHours');
  });

  it('should accept all valid sleepHours options', () => {
    const validOptions: ManualCheckInInput['sleepHours'][] = ['<5', '5-6', '6-7', '7-8', '8+'];
    for (const option of validOptions) {
      const input = createCheckInInput({ sleepHours: option });
      expect(validateCheckInInput(input)).toBeNull();
    }
  });

  it('should accept all valid quality ratings', () => {
    for (const rating of [1, 2, 3, 4, 5] as QualityRating[]) {
      const input = createCheckInInput({ sleepQuality: rating, energyLevel: rating });
      expect(validateCheckInInput(input)).toBeNull();
    }
  });
});

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

describe('Confidence', () => {
  it('should cap confidence at 0.60 for normal check-ins', () => {
    const result = calculateCheckInScore(createCheckInInput());
    expect(result.confidence).toBe(0.60);
  });

  it('should use 0.30 confidence for skipped check-ins', () => {
    const result = calculateCheckInScore(undefined, true);
    expect(result.confidence).toBe(0.30);
  });

  it('should be lower than wearable confidence (0.90)', () => {
    const result = calculateCheckInScore(createCheckInInput());
    expect(result.confidence).toBeLessThan(0.90);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle minimum possible score', () => {
    const input = createCheckInInput({
      sleepQuality: 1, // 20
      sleepHours: '<5', // ~55 (minimum is 20, but 4.5h gives higher)
      energyLevel: 1, // 20
    });

    const result = calculateCheckInScore(input);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.zone).toBe('red');
  });

  it('should handle maximum possible score', () => {
    const input = createCheckInInput({
      sleepQuality: 5, // 100
      sleepHours: '7-8', // 100
      energyLevel: 5, // 100
    });

    const result = calculateCheckInScore(input);
    expect(result.score).toBe(100);
    expect(result.zone).toBe('green');
  });

  it('should round score to whole number', () => {
    // Create inputs that would produce a non-integer score
    const input = createCheckInInput({
      sleepQuality: 3, // 60
      sleepHours: '6-7', // 85
      energyLevel: 4, // 80
    });

    const result = calculateCheckInScore(input);
    // (60 * 0.40) + (85 * 0.35) + (80 * 0.25) = 24 + 29.75 + 20 = 73.75
    expect(Number.isInteger(result.score)).toBe(true);
    expect(result.score).toBe(74); // Rounded
  });
});
