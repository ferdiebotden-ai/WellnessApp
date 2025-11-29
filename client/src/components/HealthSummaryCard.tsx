import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface HealthSummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  chartType: 'line' | 'bar';
  data?: number[]; // For chart rendering
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  chartType,
  data = [],
}) => {
  const renderLineChart = () => {
    if (data.length === 0) {
      // Generate mock data for demonstration
      const mockData = [70, 72, 75, 78, 80, 82, 85];
      return renderLineChartPath(mockData);
    }
    return renderLineChartPath(data);
  };

  const renderLineChartPath = (points: number[]) => {
    const width = 200;
    const height = 60;
    const padding = 10;
    const maxValue = Math.max(...points, 100);
    const minValue = Math.min(...points, 0);

    const xStep = (width - padding * 2) / (points.length - 1);
    const yRange = maxValue - minValue || 1;

    const pathData = points
      .map((point, index) => {
        const x = padding + index * xStep;
        const y = height - padding - ((point - minValue) / yRange) * (height - padding * 2);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const areaPath = `${pathData} L ${padding + (points.length - 1) * xStep} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={palette.primary} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={palette.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#gradient)" />
        <Path
          d={pathData}
          stroke={palette.primary}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => {
          const x = padding + index * xStep;
          const y = height - padding - ((point - minValue) / yRange) * (height - padding * 2);
          return (
            <Path
              key={index}
              d={`M ${x} ${y} L ${x} ${y}`}
              stroke={palette.primary}
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    );
  };

  const renderBarChart = () => {
    if (data.length === 0) {
      // Generate mock data for demonstration
      const mockData = [45, 50, 48, 55, 52, 58, 58];
      return renderBarChartBars(mockData);
    }
    return renderBarChartBars(data);
  };

  const renderBarChartBars = (values: number[]) => {
    const width = 200;
    const height = 60;
    const padding = 10;
    const maxValue = Math.max(...values, 100);
    const barWidth = (width - padding * 2) / values.length - 4;
    const barSpacing = 4;

    return (
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {values.map((value, index) => {
          const barHeight = ((value / maxValue) * (height - padding * 2)) || 5;
          const x = padding + index * (barWidth + barSpacing);
          const y = height - padding - barHeight;
          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={palette.primary}
              rx={2}
            />
          );
        })}
      </Svg>
    );
  };

  const trendText = trend === 'up' ? 'Trending Up' : trend === 'down' ? 'Trending Down' : '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {chartType === 'line' ? renderLineChart() : renderBarChart()}
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {trendText && <Text style={styles.trend}>{trendText}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: 160,
  },
  title: {
    ...typography.subheading,
    color: palette.textPrimary,
    marginBottom: 12,
    fontSize: 14,
  },
  chartContainer: {
    height: 60,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    gap: 4,
  },
  value: {
    ...typography.heading,
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: palette.textSecondary,
    fontSize: 12,
  },
  trend: {
    ...typography.caption,
    color: palette.primary,
    fontSize: 12,
  },
});

