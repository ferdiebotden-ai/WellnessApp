/**
 * MetricCard Component
 *
 * Generic health metric card for HRV, RHR, and other values.
 * Shows value, unit, baseline comparison, and mini sparkline.
 *
 * @file client/src/components/health/MetricCard.tsx
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { palette } from '../../theme/palette';
import { typography, fontFamily } from '../../theme/typography';

export interface MetricCardProps {
  /** Metric title */
  title: string;
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Current value */
  value: number | null;
  /** Unit label (e.g., "ms", "bpm") */
  unit: string;
  /** Comparison to baseline (e.g., "12% above baseline") */
  baselineComparison?: string | null;
  /** Direction of change vs baseline */
  trend?: 'up' | 'down' | 'stable' | null;
  /** Whether higher is better (for coloring) */
  higherIsBetter?: boolean;
  /** Mini sparkline data (last 7 values) */
  sparklineData?: (number | null)[];
  /** Color for the metric */
  color?: string;
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Whether data is loading */
  loading?: boolean;
}

function MiniSparkline({
  data,
  color,
  width = 60,
  height = 24,
}: {
  data: (number | null)[];
  color: string;
  width?: number;
  height?: number;
}) {
  const pathData = useMemo(() => {
    const validData = data.filter((d): d is number => d !== null);
    if (validData.length < 2) return '';

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxValue = Math.max(...validData);
    const minValue = Math.min(...validData);
    const range = maxValue - minValue || 1;

    const xStep = chartWidth / (validData.length - 1);

    return validData
      .map((value, index) => {
        const x = padding + index * xStep;
        const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (!pathData) return null;

  return (
    <Svg width={width} height={height}>
      <Path
        d={pathData}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MetricCard({
  title,
  icon,
  value,
  unit,
  baselineComparison,
  trend,
  higherIsBetter = true,
  sparklineData,
  color = palette.primary,
  onPress,
  loading = false,
}: MetricCardProps): React.ReactElement {
  // Determine trend color
  const trendColor = useMemo(() => {
    if (!trend || trend === 'stable') return palette.textMuted;
    const isPositive = (trend === 'up' && higherIsBetter) || (trend === 'down' && !higherIsBetter);
    return isPositive ? palette.success : palette.error;
  }, [trend, higherIsBetter]);

  // Trend icon
  const trendIcon = trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove';

  // Format value
  const formattedValue = useMemo(() => {
    if (value === null) return '--';
    return Math.round(value).toString();
  }, [value]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>...</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${formattedValue} ${unit}`}
      testID={`metric-card-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={16} color={color} />
          <Text style={styles.title}>{title}</Text>
        </View>
        {sparklineData && sparklineData.length > 0 && (
          <MiniSparkline data={sparklineData} color={color} />
        )}
      </View>

      {/* Value */}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{formattedValue}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>

      {/* Baseline comparison */}
      {baselineComparison && (
        <View style={styles.baselineRow}>
          <Ionicons
            name={trendIcon as any}
            size={12}
            color={trendColor}
          />
          <Text style={[styles.baselineText, { color: trendColor }]}>
            {baselineComparison}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// Pre-configured HRV Card
export function HRVMetricCard({
  value,
  method = 'rmssd',
  baselineComparison,
  trend,
  sparklineData,
  onPress,
  loading,
}: {
  value: number | null;
  method?: 'rmssd' | 'sdnn' | 'unknown' | null;
  baselineComparison?: string | null;
  trend?: 'up' | 'down' | 'stable' | null;
  sparklineData?: (number | null)[];
  onPress?: () => void;
  loading?: boolean;
}) {
  return (
    <MetricCard
      title="HRV"
      icon="pulse"
      value={value}
      unit={method === 'sdnn' ? 'ms SDNN' : 'ms'}
      baselineComparison={baselineComparison}
      trend={trend}
      higherIsBetter={true}
      sparklineData={sparklineData}
      color="#10B981" // Emerald
      onPress={onPress}
      loading={loading}
    />
  );
}

// Pre-configured RHR Card
export function RHRMetricCard({
  value,
  baselineComparison,
  trend,
  sparklineData,
  onPress,
  loading,
}: {
  value: number | null;
  baselineComparison?: string | null;
  trend?: 'up' | 'down' | 'stable' | null;
  sparklineData?: (number | null)[];
  onPress?: () => void;
  loading?: boolean;
}) {
  return (
    <MetricCard
      title="Resting HR"
      icon="heart"
      value={value}
      unit="bpm"
      baselineComparison={baselineComparison}
      trend={trend}
      higherIsBetter={false} // Lower RHR is better
      sparklineData={sparklineData}
      color="#F59E0B" // Amber
      onPress={onPress}
      loading={loading}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    minWidth: 140,
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  loadingText: {
    ...typography.bodySmall,
    color: palette.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  value: {
    fontFamily: fontFamily.monoBold,
    fontSize: 28,
    color: palette.textPrimary,
    letterSpacing: -1,
  },
  unit: {
    ...typography.caption,
    color: palette.textMuted,
  },
  baselineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  baselineText: {
    ...typography.caption,
    fontSize: 11,
  },
});

export default MetricCard;
