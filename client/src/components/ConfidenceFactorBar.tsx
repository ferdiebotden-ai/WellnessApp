/**
 * ConfidenceFactorBar
 *
 * Animated progress bar for a single confidence factor.
 * Shows label, animated fill, and percentage score.
 *
 * Design: Bloomberg Terminal precision — clean data visualization with semantic colors.
 *
 * @file client/src/components/ConfidenceFactorBar.tsx
 * @author Claude Opus 4.5 (Session 46)
 * @created December 5, 2025
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { getFactorColor, formatFactorScore } from '../utils/confidenceHelpers';

// =============================================================================
// TYPES
// =============================================================================

interface Props {
  /** Factor label (e.g., "Protocol Fit") */
  label: string;
  /** Factor score (0-1) */
  score: number;
  /** Factor weight (0-1), optional for display */
  weight?: number;
  /** Animation delay in ms */
  delay?: number;
  /** Show label and score (false for ultra-compact mode) */
  showLabel?: boolean;
  /** Show weight badge */
  showWeight?: boolean;
  /** Test ID for E2E testing */
  testID?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BAR_HEIGHT = 4;
const ANIMATION_DURATION = 300;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ConfidenceFactorBar displays a single confidence factor with animated fill.
 *
 * Animation:
 * - Bar fills from 0% to score over 300ms
 * - Color determined by score threshold (green/amber/red)
 * - Staggered with delay prop for cascading effect
 */
export const ConfidenceFactorBar: React.FC<Props> = ({
  label,
  score,
  weight,
  delay = 0,
  showLabel = true,
  showWeight = false,
  testID,
}) => {
  // Shared value for animated width
  const animatedWidth = useSharedValue(0);
  const barColor = getFactorColor(score);

  // Trigger animation on mount or score change
  useEffect(() => {
    animatedWidth.value = withTiming(score, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [score, animatedWidth]);

  // Animated style for the bar fill
  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%`,
  }));

  return (
    <View style={styles.container} testID={testID}>
      {/* Label row */}
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          <View style={styles.labelRight}>
            {showWeight && weight !== undefined && (
              <Text style={styles.weight}>
                {Math.round(weight * 100)}%
              </Text>
            )}
            <Text style={[styles.score, { color: barColor }]}>
              {formatFactorScore(score)}
            </Text>
          </View>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: barColor },
            animatedFillStyle,
          ]}
        />
      </View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    ...typography.caption,
    color: palette.textMuted,
    flex: 1,
  },
  labelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weight: {
    ...typography.caption,
    color: palette.textMuted,
    opacity: 0.6,
    fontSize: 10,
  },
  score: {
    ...typography.caption,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  barBackground: {
    height: BAR_HEIGHT,
    backgroundColor: palette.elevated,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
  },
});

export default ConfidenceFactorBar;
