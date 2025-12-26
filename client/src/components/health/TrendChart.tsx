/**
 * TrendChart Component
 *
 * Line/area chart for displaying 7-day or 30-day health metric trends.
 * Uses react-native-svg for rendering, consistent with HealthSummaryCard pattern.
 *
 * Features:
 * - Animated path drawing
 * - Gradient area fill
 * - Optional touch interaction for values
 * - Date labels on x-axis
 * - Average line indicator
 *
 * @file client/src/components/health/TrendChart.tsx
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';
import { typography, fontFamily } from '../../theme/typography';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface ChartDataPoint {
  date: string; // YYYY-MM-DD
  value: number | null;
  label?: string; // Optional display label
}

export interface TrendChartProps {
  /** Array of data points */
  data: ChartDataPoint[];
  /** Chart title */
  title: string;
  /** Unit label (e.g., "ms", "bpm", "hours") */
  unit: string;
  /** Chart height */
  height?: number;
  /** Show average line */
  showAverage?: boolean;
  /** Line/fill color */
  color?: string;
  /** Area fill color (optional, will use color with opacity if not provided) */
  areaColor?: string;
  /** Show dots on data points */
  showDots?: boolean;
  /** Callback when point is tapped */
  onPointPress?: (point: ChartDataPoint, index: number) => void;
}

/**
 * Calculate chart colors based on metric type
 */
export const chartColors = {
  sleep: { line: '#6366F1', area: 'rgba(99, 102, 241, 0.2)' },
  hrv: { line: '#10B981', area: 'rgba(16, 185, 129, 0.2)' },
  rhr: { line: '#F59E0B', area: 'rgba(245, 158, 11, 0.2)' },
  steps: { line: palette.primary, area: 'rgba(99, 230, 190, 0.2)' },
  recovery: { line: palette.success, area: 'rgba(74, 222, 128, 0.2)' },
};

export function TrendChart({
  data,
  title,
  unit,
  height = 120,
  showAverage = true,
  color = palette.primary,
  areaColor,
  showDots = true,
  onPointPress,
}: TrendChartProps): React.ReactElement {
  const width = 320; // Will be responsive
  const padding = { top: 16, right: 16, bottom: 24, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Filter out null values for calculations
  const validData = useMemo(() =>
    data.filter((d): d is ChartDataPoint & { value: number } => d.value !== null),
    [data]
  );

  // Calculate min/max values
  const { minValue, maxValue, avgValue } = useMemo(() => {
    if (validData.length === 0) {
      return { minValue: 0, maxValue: 100, avgValue: 50 };
    }
    const values = validData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    // Add 10% padding to range
    const range = max - min || 1;
    return {
      minValue: min - range * 0.1,
      maxValue: max + range * 0.1,
      avgValue: avg,
    };
  }, [validData]);

  // Calculate point positions
  const points = useMemo(() => {
    if (data.length === 0) return [];

    const xStep = chartWidth / Math.max(data.length - 1, 1);
    const yRange = maxValue - minValue || 1;

    return data.map((d, i) => {
      const x = padding.left + i * xStep;
      const y = d.value !== null
        ? padding.top + chartHeight - ((d.value - minValue) / yRange) * chartHeight
        : null;
      return { ...d, x, y, index: i };
    });
  }, [data, chartWidth, chartHeight, minValue, maxValue, padding]);

  // Generate SVG path for line
  const linePath = useMemo(() => {
    const validPoints = points.filter(p => p.y !== null);
    if (validPoints.length < 2) return '';

    return validPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  }, [points]);

  // Generate SVG path for area fill
  const areaPath = useMemo(() => {
    const validPoints = points.filter(p => p.y !== null);
    if (validPoints.length < 2) return '';

    const bottomY = padding.top + chartHeight;
    const firstX = validPoints[0].x;
    const lastX = validPoints[validPoints.length - 1].x;

    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, points, padding, chartHeight]);

  // Calculate average line Y position
  const avgY = useMemo(() => {
    const yRange = maxValue - minValue || 1;
    return padding.top + chartHeight - ((avgValue - minValue) / yRange) * chartHeight;
  }, [avgValue, minValue, maxValue, chartHeight, padding]);

  // Animation for path drawing
  const pathProgress = useSharedValue(0);

  React.useEffect(() => {
    pathProgress.value = 0;
    pathProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [data, pathProgress]);

  // Get date labels for x-axis
  const dateLabels = useMemo(() => {
    if (data.length <= 7) {
      // Show all dates for 7-day view
      return data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      });
    } else {
      // Show fewer labels for 30-day view
      return data.map((d, i) => {
        if (i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }
        return '';
      });
    }
  }, [data]);

  // Current/latest value for display
  const latestValue = validData.length > 0 ? validData[validData.length - 1].value : null;

  // Effective area color
  const effectiveAreaColor = areaColor || color.replace(')', ', 0.2)').replace('rgb', 'rgba');

  // Handle empty state
  if (data.length === 0 || validData.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: height + 40 }]}>
      {/* Header with title and current value */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {latestValue !== null && (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{latestValue.toFixed(unit === 'hours' ? 1 : 0)}</Text>
            <Text style={styles.unit}>{unit}</Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={`areaGradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Average line */}
        {showAverage && validData.length > 1 && (
          <G>
            <Line
              x1={padding.left}
              y1={avgY}
              x2={width - padding.right}
              y2={avgY}
              stroke={palette.textMuted}
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.5}
            />
          </G>
        )}

        {/* Area fill */}
        {areaPath && (
          <Path
            d={areaPath}
            fill={`url(#areaGradient-${title})`}
          />
        )}

        {/* Line */}
        {linePath && (
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {showDots && points.map((point, index) => {
          if (point.y === null) return null;
          return (
            <Circle
              key={`dot-${index}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={color}
              stroke={palette.surface}
              strokeWidth={2}
            />
          );
        })}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {dateLabels.map((label, index) => (
          <Text
            key={`label-${index}`}
            style={[
              styles.axisLabel,
              { width: chartWidth / Math.max(data.length - 1, 1) },
              index === 0 && { textAlign: 'left' },
              index === data.length - 1 && { textAlign: 'right' },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Average label */}
      {showAverage && validData.length > 1 && (
        <View style={[styles.avgLabel, { top: avgY - 8 }]}>
          <Text style={styles.avgText}>
            avg {avgValue.toFixed(unit === 'hours' ? 1 : 0)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 18,
    color: palette.textPrimary,
  },
  unit: {
    ...typography.caption,
    color: palette.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
    color: palette.textMuted,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  axisLabel: {
    ...typography.caption,
    fontSize: 10,
    color: palette.textMuted,
    textAlign: 'center',
  },
  avgLabel: {
    position: 'absolute',
    right: 20,
    backgroundColor: palette.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  avgText: {
    ...typography.caption,
    fontSize: 10,
    color: palette.textMuted,
  },
});

export default TrendChart;
