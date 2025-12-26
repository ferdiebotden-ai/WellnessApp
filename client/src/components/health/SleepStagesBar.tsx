/**
 * SleepStagesBar Component
 *
 * Horizontal stacked bar showing sleep stage distribution.
 *
 * Colors:
 * - Deep: #6366F1 (Indigo)
 * - REM: #A78BFA (Purple)
 * - Light: #38BDF8 (Sky blue)
 * - Awake: #94A3B8 (Gray)
 *
 * @file client/src/components/health/SleepStagesBar.tsx
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';

// Sleep stage colors
export const sleepStageColors = {
  deep: '#6366F1',    // Indigo - Deep sleep
  rem: '#A78BFA',     // Purple - REM sleep
  light: '#38BDF8',   // Sky blue - Light sleep
  awake: '#94A3B8',   // Gray - Awake
};

export interface SleepStagesBarProps {
  /** Deep sleep percentage (0-100) */
  deep: number;
  /** REM sleep percentage (0-100) */
  rem: number;
  /** Light sleep percentage (0-100) */
  light: number;
  /** Awake percentage (0-100) */
  awake: number;
  /** Bar height */
  height?: number;
  /** Show percentage labels */
  showLabels?: boolean;
  /** Animation enabled */
  animated?: boolean;
}

interface StageSegmentProps {
  percentage: number;
  color: string;
  label: string;
  isFirst?: boolean;
  isLast?: boolean;
}

function StageSegment({ percentage, color, label, isFirst, isLast }: StageSegmentProps) {
  if (percentage <= 0) return null;

  return (
    <View
      style={[
        styles.segment,
        {
          width: `${percentage}%`,
          backgroundColor: color,
          borderTopLeftRadius: isFirst ? 4 : 0,
          borderBottomLeftRadius: isFirst ? 4 : 0,
          borderTopRightRadius: isLast ? 4 : 0,
          borderBottomRightRadius: isLast ? 4 : 0,
        },
      ]}
    />
  );
}

export function SleepStagesBar({
  deep,
  rem,
  light,
  awake,
  height = 12,
  showLabels = true,
  animated = true,
}: SleepStagesBarProps): React.ReactElement {
  // Normalize percentages to ensure they sum to 100
  const total = deep + rem + light + awake;
  const normalize = (val: number) => total > 0 ? (val / total) * 100 : 0;

  const normalizedDeep = normalize(deep);
  const normalizedRem = normalize(rem);
  const normalizedLight = normalize(light);
  const normalizedAwake = normalize(awake);

  // Determine which segments are first and last
  const segments = [
    { pct: normalizedDeep, color: sleepStageColors.deep, label: 'Deep' },
    { pct: normalizedRem, color: sleepStageColors.rem, label: 'REM' },
    { pct: normalizedLight, color: sleepStageColors.light, label: 'Light' },
    { pct: normalizedAwake, color: sleepStageColors.awake, label: 'Awake' },
  ].filter(s => s.pct > 0);

  return (
    <View style={styles.container}>
      {/* Bar */}
      <View style={[styles.bar, { height }]}>
        {segments.map((segment, index) => (
          <StageSegment
            key={segment.label}
            percentage={segment.pct}
            color={segment.color}
            label={segment.label}
            isFirst={index === 0}
            isLast={index === segments.length - 1}
          />
        ))}
      </View>

      {/* Labels */}
      {showLabels && (
        <View style={styles.labelsRow}>
          {normalizedDeep > 0 && (
            <View style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: sleepStageColors.deep }]} />
              <Text style={styles.labelText}>Deep {Math.round(deep)}%</Text>
            </View>
          )}
          {normalizedRem > 0 && (
            <View style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: sleepStageColors.rem }]} />
              <Text style={styles.labelText}>REM {Math.round(rem)}%</Text>
            </View>
          )}
          {normalizedLight > 0 && (
            <View style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: sleepStageColors.light }]} />
              <Text style={styles.labelText}>Light {Math.round(light)}%</Text>
            </View>
          )}
          {normalizedAwake > 0 && (
            <View style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: sleepStageColors.awake }]} />
              <Text style={styles.labelText}>Awake {Math.round(awake)}%</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: palette.subtle,
  },
  segment: {
    height: '100%',
  },
  labelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 12,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelText: {
    ...typography.caption,
    fontSize: 11,
    color: palette.textMuted,
  },
});

export default SleepStagesBar;
