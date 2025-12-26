/**
 * QuickHealthStats Component
 *
 * Horizontal row of key health metrics for the Home screen.
 * Tapping navigates to the full Health Dashboard.
 *
 * @file client/src/components/health/QuickHealthStats.tsx
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { palette } from '../../theme/palette';
import { typography, fontFamily } from '../../theme/typography';

export interface QuickHealthStatsProps {
  /** Step count */
  steps: number | null;
  /** Sleep duration in hours */
  sleepHours: number | null;
  /** HRV in milliseconds */
  hrv: number | null;
  /** Resting heart rate in bpm */
  rhr: number | null;
  /** Whether data is loading */
  loading?: boolean;
}

interface MiniMetricProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color?: string;
  onPress?: () => void;
}

function MiniMetric({ icon, value, label, color = palette.primary, onPress }: MiniMetricProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.metricContainer,
        pressed && styles.metricPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}

export function QuickHealthStats({
  steps,
  sleepHours,
  hrv,
  rhr,
  loading = false,
}: QuickHealthStatsProps): React.ReactElement {
  const navigation = useNavigation<any>();

  const navigateToHealth = () => {
    navigation.navigate('Health');
  };

  // Format values
  const formatSteps = (val: number | null) => {
    if (val === null) return '--';
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toString();
  };

  const formatSleep = (val: number | null) => {
    if (val === null) return '--';
    const hours = Math.floor(val);
    const mins = Math.round((val - hours) * 60);
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const formatHrv = (val: number | null) => {
    if (val === null) return '--';
    return `${Math.round(val)}`;
  };

  const formatRhr = (val: number | null) => {
    if (val === null) return '--';
    return `${Math.round(val)}`;
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingRow}>
          <View style={styles.loadingMetric} />
          <View style={styles.loadingMetric} />
          <View style={styles.loadingMetric} />
          <View style={styles.loadingMetric} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TODAY'S HEALTH</Text>
        <Pressable onPress={navigateToHealth} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={palette.primary} />
        </Pressable>
      </View>

      <View style={styles.metricsRow}>
        <MiniMetric
          icon="footsteps"
          value={formatSteps(steps)}
          label="steps"
          color={palette.primary}
          onPress={navigateToHealth}
        />
        <MiniMetric
          icon="moon"
          value={formatSleep(sleepHours)}
          label="sleep"
          color="#6366F1"
          onPress={navigateToHealth}
        />
        <MiniMetric
          icon="pulse"
          value={formatHrv(hrv)}
          label="HRV"
          color="#10B981"
          onPress={navigateToHealth}
        />
        <MiniMetric
          icon="heart"
          value={formatRhr(rhr)}
          label="RHR"
          color="#F59E0B"
          onPress={navigateToHealth}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    ...typography.label,
    color: palette.textMuted,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricContainer: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 12,
  },
  metricPressed: {
    backgroundColor: palette.elevated,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 16,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 10,
    color: palette.textMuted,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 28, // Account for hidden header
  },
  loadingMetric: {
    width: 60,
    height: 60,
    backgroundColor: palette.elevated,
    borderRadius: 12,
  },
});

export default QuickHealthStats;
