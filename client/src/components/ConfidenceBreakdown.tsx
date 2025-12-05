/**
 * ConfidenceBreakdown
 *
 * 5-factor confidence visualization component.
 * Shows how each factor contributes to the overall confidence score.
 *
 * Design: Data transparency for the "Bloomberg Terminal for the Body" — users
 * understand exactly WHY a recommendation has certain confidence.
 *
 * @file client/src/components/ConfidenceBreakdown.tsx
 * @author Claude Opus 4.5 (Session 46)
 * @created December 5, 2025
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { ConfidenceFactors, ConfidenceLevel } from '../types/confidence';
import { ConfidenceFactorBar } from './ConfidenceFactorBar';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import {
  getOrderedFactorEntries,
  formatFactorScore,
  getConfidenceLevelColor,
  calculateOverallConfidence,
} from '../utils/confidenceHelpers';

// =============================================================================
// TYPES
// =============================================================================

interface Props {
  /** Individual factor scores */
  factors: ConfidenceFactors;
  /** Overall confidence score (0-1), calculated if not provided */
  overall?: number;
  /** Confidence level for display */
  level: ConfidenceLevel;
  /** Compact mode for NudgeCard (smaller, no weights) */
  compact?: boolean;
  /** Show section header */
  showHeader?: boolean;
  /** Animation stagger delay between bars */
  staggerDelay?: number;
  /** Test ID for E2E testing */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ConfidenceBreakdown displays all 5 confidence factors with animated bars.
 *
 * Layout:
 * - Optional section header
 * - 5 factor bars (staggered animation)
 * - Overall score summary with level indicator
 */
export const ConfidenceBreakdown: React.FC<Props> = ({
  factors,
  overall,
  level,
  compact = false,
  showHeader = true,
  staggerDelay = 50,
  testID,
}) => {
  // Get ordered factor entries for rendering
  const factorEntries = useMemo(
    () => getOrderedFactorEntries(factors),
    [factors]
  );

  // Calculate overall if not provided
  const overallScore = useMemo(
    () => overall ?? calculateOverallConfidence(factors),
    [overall, factors]
  );

  // Get color for overall level
  const levelColor = getConfidenceLevelColor(level);

  return (
    <View style={styles.container} testID={testID}>
      {/* Section header */}
      {showHeader && (
        <Animated.View entering={FadeIn.duration(150)}>
          <Text style={styles.header}>CONFIDENCE BREAKDOWN</Text>
        </Animated.View>
      )}

      {/* Factor bars */}
      <View style={styles.barsContainer}>
        {factorEntries.map((entry, index) => (
          <Animated.View
            key={entry.key}
            entering={FadeIn.duration(150).delay(index * staggerDelay)}
          >
            <ConfidenceFactorBar
              label={entry.label}
              score={entry.score}
              weight={entry.weight}
              delay={index * staggerDelay}
              showLabel={true}
              showWeight={!compact}
              testID={testID ? `${testID}-bar-${entry.key}` : undefined}
            />
          </Animated.View>
        ))}
      </View>

      {/* Overall summary */}
      <Animated.View
        entering={FadeIn.duration(150).delay(factorEntries.length * staggerDelay)}
        style={styles.summaryContainer}
      >
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Overall</Text>
          <View style={styles.summaryRight}>
            <View
              style={[styles.levelIndicator, { backgroundColor: levelColor }]}
            />
            <Text style={[styles.levelText, { color: levelColor }]}>
              {level}
            </Text>
            <Text style={styles.overallScore}>
              ({formatFactorScore(overallScore)})
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    // Container styling
  },
  header: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 12,
  },
  barsContainer: {
    // Bars stack vertically (spacing handled by ConfidenceFactorBar marginBottom)
  },
  summaryContainer: {
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: palette.border,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.body,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    ...typography.body,
    fontWeight: '600',
  },
  overallScore: {
    ...typography.caption,
    color: palette.textMuted,
  },
});

export default ConfidenceBreakdown;
