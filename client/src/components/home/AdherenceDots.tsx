/**
 * AdherenceDots
 *
 * Reusable 7-day adherence indicator showing filled/empty dots.
 * Used in WeeklyProgressCard to display protocol completion.
 *
 * Example: ●●●●●○○ 5/7
 *
 * @file client/src/components/home/AdherenceDots.tsx
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';

interface Props {
  /** Number of completed days (0-7) */
  completed: number;
  /** Total days to show (default: 7) */
  total?: number;
  /** Whether to show the count label (e.g., "5/7") */
  showLabel?: boolean;
  /** Size variant */
  size?: 'small' | 'default';
  /** Test ID for testing */
  testID?: string;
}

export const AdherenceDots: React.FC<Props> = ({
  completed,
  total = 7,
  showLabel = true,
  size = 'default',
  testID,
}) => {
  // Clamp completed to valid range
  const filledCount = Math.max(0, Math.min(completed, total));

  const dotSize = size === 'small' ? 5 : 6;
  const gap = size === 'small' ? 3 : 4;

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.dotsRow, { gap }]}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
              },
              index < filledCount ? styles.dotFilled : styles.dotEmpty,
            ]}
            testID={`${testID}-dot-${index}`}
          />
        ))}
      </View>
      {showLabel && (
        <Text
          style={[styles.label, size === 'small' && styles.labelSmall]}
          testID={`${testID}-label`}
        >
          {filledCount}/{total}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    // Size set dynamically
  },
  dotFilled: {
    backgroundColor: palette.primary,
  },
  dotEmpty: {
    backgroundColor: palette.elevated,
  },
  label: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 10,
  },
});

export default AdherenceDots;
