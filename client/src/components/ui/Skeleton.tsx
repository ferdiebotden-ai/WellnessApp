import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';
import { tokens } from '../../theme/tokens';

interface SkeletonProps {
  /** Width of the skeleton (number or string like '100%') */
  width?: DimensionValue;
  /** Height of the skeleton */
  height?: DimensionValue;
  /** Border radius */
  borderRadius?: number;
  /** Additional style */
  style?: ViewStyle;
  /** Whether to animate the shimmer */
  animated?: boolean;
}

/**
 * Skeleton Loading Component
 *
 * Displays a shimmer animation for loading states.
 * Use instead of spinners for content placeholders.
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = tokens.radius.sm,
  style,
  animated = true,
}: SkeletonProps): JSX.Element {
  const shimmer = useSharedValue(0.3);

  useEffect(() => {
    if (animated) {
      shimmer.value = withRepeat(
        withTiming(0.7, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1, // Infinite
        true // Reverse
      );
    }
  }, [animated, shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  const sizeStyle: ViewStyle = { width, height, borderRadius };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        sizeStyle,
        style,
        animated && animatedStyle,
      ]}
    />
  );
}

/**
 * Skeleton Card - Pre-configured skeleton for card layouts
 */
export function SkeletonCard({ style }: { style?: ViewStyle }): JSX.Element {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width="40%" height={14} style={styles.mb8} />
      <Skeleton width="100%" height={48} style={styles.mb16} />
      <Skeleton width="60%" height={12} />
    </View>
  );
}

/**
 * Skeleton Protocol Card
 */
export function SkeletonProtocolCard({ style }: { style?: ViewStyle }): JSX.Element {
  return (
    <View style={[styles.protocolCard, style]}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.protocolContent}>
        <Skeleton width="70%" height={18} style={styles.mb8} />
        <Skeleton width="40%" height={14} />
      </View>
      <Skeleton width={40} height={14} />
    </View>
  );
}

/**
 * Skeleton Text Lines - Multiple text lines
 */
export function SkeletonText({
  lines = 3,
  style,
}: {
  lines?: number;
  style?: ViewStyle;
}): JSX.Element {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={14}
          style={i < lines - 1 ? styles.mb8 : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: palette.subtle,
    overflow: 'hidden',
  },

  card: {
    backgroundColor: palette.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: palette.subtle,
  },

  protocolCard: {
    backgroundColor: palette.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: palette.subtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  protocolContent: {
    flex: 1,
  },

  mb8: {
    marginBottom: 8,
  },

  mb16: {
    marginBottom: 16,
  },
});

export default Skeleton;
