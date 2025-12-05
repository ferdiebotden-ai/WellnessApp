/**
 * EdgeCaseBadgeRow
 *
 * Container component that renders active edge case badges horizontally.
 * Automatically filters inactive conditions and sorts by priority.
 *
 * Features:
 * - Staggered fade-in animation for each badge
 * - Priority-based ordering (highest first)
 * - Max badge limit to prevent overflow
 *
 * @file client/src/components/EdgeCaseBadgeRow.tsx
 * @author Claude Opus 4.5 (Session 46)
 * @created December 5, 2025
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { EdgeCases } from '../types/edgeCases';
import { EdgeCaseBadge } from './EdgeCaseBadge';
import { getEdgeCaseBadgeConfigs, hasActiveEdgeCases } from '../utils/edgeCaseHelpers';

// =============================================================================
// TYPES
// =============================================================================

type BadgeSize = 'small' | 'default';

interface Props {
  /** Edge case detection results from recovery score */
  edgeCases: EdgeCases;
  /** Size variant: 'small' for NudgeCard, 'default' for RecoveryScoreCard */
  size?: BadgeSize;
  /** Maximum badges to display (default: 3) */
  maxBadges?: number;
  /** Animation delay between badges in ms (default: 50) */
  staggerDelay?: number;
  /** Test ID prefix for E2E testing */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * EdgeCaseBadgeRow displays active edge case badges in a horizontal row.
 *
 * Behavior:
 * - Returns null if no active edge cases
 * - Sorts badges by priority (highest first)
 * - Limits to maxBadges to prevent UI overflow
 * - Each badge fades in with staggered delay
 */
export const EdgeCaseBadgeRow: React.FC<Props> = ({
  edgeCases,
  size = 'default',
  maxBadges = 3,
  staggerDelay = 50,
  testID,
}) => {
  // Get sorted badge configurations
  const badgeConfigs = useMemo(
    () => getEdgeCaseBadgeConfigs(edgeCases, maxBadges),
    [edgeCases, maxBadges]
  );

  // Early return if no active edge cases
  if (!hasActiveEdgeCases(edgeCases)) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="none"
      testID={testID}
    >
      {badgeConfigs.map((config, index) => (
        <Animated.View
          key={config.type}
          entering={FadeIn.duration(150).delay(index * staggerDelay)}
        >
          <EdgeCaseBadge
            type={config.type}
            size={size}
            testID={testID ? `${testID}-badge-${config.type}` : undefined}
          />
        </Animated.View>
      ))}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
});

export default EdgeCaseBadgeRow;
