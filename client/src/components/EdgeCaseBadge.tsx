/**
 * EdgeCaseBadge
 *
 * Reusable badge component for displaying edge case conditions.
 * Follows the ZoneBadge pattern: colored dot + label in semi-transparent pill.
 *
 * Design: Premium health tech aesthetic — subtle but informative indicators.
 *
 * @file client/src/components/EdgeCaseBadge.tsx
 * @author Claude Opus 4.5 (Session 46)
 * @created December 5, 2025
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { EdgeCaseType, EdgeCaseBadgeConfig } from '../types/edgeCases';
import { EDGE_CASE_CONFIGS } from '../types/edgeCases';
import { typography } from '../theme/typography';

// =============================================================================
// TYPES
// =============================================================================

type BadgeSize = 'small' | 'default';

interface Props {
  /** Edge case type to display */
  type: EdgeCaseType;
  /** Size variant: 'small' for NudgeCard, 'default' for RecoveryScoreCard */
  size?: BadgeSize;
  /** Test ID for E2E testing */
  testID?: string;
}

// =============================================================================
// SIZE CONFIGURATIONS
// =============================================================================

const SIZE_CONFIG: Record<BadgeSize, {
  paddingHorizontal: number;
  paddingVertical: number;
  borderRadius: number;
  dotSize: number;
  gap: number;
  fontSize: number;
}> = {
  default: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    dotSize: 8,
    gap: 6,
    fontSize: 11,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    dotSize: 6,
    gap: 5,
    fontSize: 10,
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * EdgeCaseBadge displays a single edge case condition as a styled badge.
 *
 * Visual pattern:
 * - Colored indicator dot
 * - Uppercase label text
 * - Semi-transparent background (color at 20% opacity)
 */
export const EdgeCaseBadge: React.FC<Props> = ({
  type,
  size = 'default',
  testID,
}) => {
  const config: EdgeCaseBadgeConfig = EDGE_CASE_CONFIGS[type];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${config.color}20`,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
          gap: sizeConfig.gap,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={config.description}
      testID={testID}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: config.color,
            width: sizeConfig.dotSize,
            height: sizeConfig.dotSize,
            borderRadius: sizeConfig.dotSize / 2,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: sizeConfig.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    // Size set dynamically
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default EdgeCaseBadge;
