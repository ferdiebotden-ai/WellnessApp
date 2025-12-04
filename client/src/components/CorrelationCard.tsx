import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import type { Correlation } from '../types/correlations';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface Props {
  correlation: Correlation;
}

/**
 * Displays a single protocol-outcome correlation.
 * Design per PRD Section 5.8.
 *
 * Shows:
 * - Trend arrow (up = positive/green, down = negative/amber)
 * - Protocol → Outcome label
 * - Interpretation with p-value
 * - Days tracked progress bar
 */
export const CorrelationCard: React.FC<Props> = ({ correlation }) => {
  const isPositive = correlation.direction === 'positive';
  const isNegative = correlation.direction === 'negative';

  // Color coding: green for beneficial, amber for concerning
  const trendColor = useMemo(() => {
    if (isPositive) return palette.success;
    if (isNegative) return palette.accent;
    return palette.textMuted;
  }, [isPositive, isNegative]);

  const trendArrow = useMemo(() => {
    if (isPositive) return '↑';
    if (isNegative) return '↓';
    return '●';
  }, [isPositive, isNegative]);

  // Progress bar: sample_size out of 30 days (lookback window)
  const progressWidth = useMemo((): DimensionValue => {
    const percent = Math.min(100, Math.round((correlation.sample_size / 30) * 100));
    return `${percent}%` as DimensionValue;
  }, [correlation.sample_size]);

  return (
    <View style={styles.container} accessibilityRole="summary">
      {/* Header: Arrow + Protocol → Outcome */}
      <View style={styles.headerRow}>
        <Text style={[styles.arrow, { color: trendColor }]}>{trendArrow}</Text>
        <Text style={styles.label}>
          {correlation.protocol_name} → {correlation.outcome_name}
        </Text>
      </View>

      {/* Interpretation with p-value */}
      <Text style={styles.interpretation}>
        {correlation.interpretation} (p={correlation.p_value.toFixed(2)})
      </Text>

      {/* Progress bar: days tracked */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressTrack, { width: progressWidth }]} />
        </View>
        <Text style={styles.daysLabel}>{correlation.sample_size} days tracked</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    ...typography.subheading,
    color: palette.textPrimary,
    flex: 1,
  },
  interpretation: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: palette.elevated,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressTrack: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: palette.primary,
  },
  daysLabel: {
    ...typography.caption,
    color: palette.textMuted,
    minWidth: 90,
    textAlign: 'right',
  },
});
