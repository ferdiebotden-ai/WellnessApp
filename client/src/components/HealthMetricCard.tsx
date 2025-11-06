import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { HealthMetric } from '../types/dashboard';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface Props {
  metric: HealthMetric;
}

export const HealthMetricCard: React.FC<Props> = ({ metric }) => {
  const progressWidth = useMemo(() => `${Math.round(metric.progress * 100)}%`, [metric.progress]);

  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={styles.headerRow}>
        <Text style={styles.label}>{metric.label}</Text>
        <Text style={styles.value}>{metric.valueLabel}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressTrack, { width: progressWidth }]} />
      </View>
      <Text style={styles.trend} accessibilityLabel={`trend ${metric.trend}`}>
        {metric.trend === 'up' && '▲ Improving'}
        {metric.trend === 'down' && '▼ Needs attention'}
        {metric.trend === 'steady' && '● Stable'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.subheading,
    color: palette.textSecondary,
  },
  value: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: palette.elevated,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressTrack: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: palette.primary,
  },
  trend: {
    ...typography.caption,
    color: palette.textMuted,
  },
});
