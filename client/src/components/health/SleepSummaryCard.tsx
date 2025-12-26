/**
 * SleepSummaryCard Component
 *
 * Displays sleep duration and quality with stage breakdown.
 *
 * Features:
 * - Total sleep duration
 * - Sleep efficiency percentage
 * - Sleep stages bar (Deep/REM/Light/Awake)
 * - Bedtime window indicator
 *
 * @file client/src/components/health/SleepSummaryCard.tsx
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { typography, fontFamily } from '../../theme/typography';
import { SleepStagesBar } from './SleepStagesBar';

export interface SleepData {
  durationHours: number | null;
  efficiency: number | null;
  deepPct: number | null;
  remPct: number | null;
  lightPct?: number | null;
  awakePct?: number | null;
  bedtimeStart: string | null;
  bedtimeEnd: string | null;
}

export interface SleepSummaryCardProps {
  /** Sleep data */
  sleep: SleepData;
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Whether data is loading */
  loading?: boolean;
}

export function SleepSummaryCard({
  sleep,
  onPress,
  loading = false,
}: SleepSummaryCardProps): React.ReactElement {
  // Format duration as hours and minutes
  const formattedDuration = useMemo(() => {
    if (sleep.durationHours === null) return '--';
    const hours = Math.floor(sleep.durationHours);
    const minutes = Math.round((sleep.durationHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  }, [sleep.durationHours]);

  // Format bedtime window
  const bedtimeWindow = useMemo(() => {
    if (!sleep.bedtimeStart || !sleep.bedtimeEnd) return null;
    const formatTime = (iso: string) => {
      const date = new Date(iso);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };
    return `${formatTime(sleep.bedtimeStart)} - ${formatTime(sleep.bedtimeEnd)}`;
  }, [sleep.bedtimeStart, sleep.bedtimeEnd]);

  // Calculate light sleep percentage if not provided
  const sleepStages = useMemo(() => {
    const deep = sleep.deepPct ?? 0;
    const rem = sleep.remPct ?? 0;
    const awake = sleep.awakePct ?? 8; // Default 8%
    const light = sleep.lightPct ?? Math.max(0, 100 - deep - rem - awake);
    return { deep, rem, light, awake };
  }, [sleep]);

  // Determine sleep quality label
  const qualityLabel = useMemo(() => {
    if (sleep.efficiency === null) return 'No data';
    if (sleep.efficiency >= 90) return 'Excellent';
    if (sleep.efficiency >= 80) return 'Good';
    if (sleep.efficiency >= 70) return 'Fair';
    return 'Poor';
  }, [sleep.efficiency]);

  const qualityColor = useMemo(() => {
    if (sleep.efficiency === null) return palette.textMuted;
    if (sleep.efficiency >= 90) return palette.success;
    if (sleep.efficiency >= 80) return palette.primary;
    if (sleep.efficiency >= 70) return palette.warning;
    return palette.error;
  }, [sleep.efficiency]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sleep data...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (sleep.durationHours === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="moon" size={18} color={palette.primary} />
            <Text style={styles.title}>SLEEP</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No sleep data for today</Text>
          <Text style={styles.emptySubtext}>
            Sleep data syncs automatically from your wearable
          </Text>
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
      accessibilityLabel={`Sleep: ${formattedDuration}, ${sleep.efficiency}% efficient`}
      testID="sleep-summary-card"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="moon" size={18} color={palette.primary} />
          <Text style={styles.title}>SLEEP</Text>
        </View>
        <View style={[styles.qualityBadge, { backgroundColor: `${qualityColor}20` }]}>
          <Text style={[styles.qualityText, { color: qualityColor }]}>
            {qualityLabel}
          </Text>
        </View>
      </View>

      {/* Main stats row */}
      <View style={styles.statsRow}>
        {/* Duration */}
        <View style={styles.mainStat}>
          <Text style={styles.statValue}>{formattedDuration}</Text>
          <Text style={styles.statLabel}>Total sleep</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Efficiency */}
        <View style={styles.mainStat}>
          <Text style={styles.statValue}>
            {sleep.efficiency !== null ? `${sleep.efficiency}%` : '--'}
          </Text>
          <Text style={styles.statLabel}>Efficiency</Text>
        </View>
      </View>

      {/* Sleep stages breakdown */}
      <View style={styles.stagesSection}>
        <Text style={styles.stagesSectionTitle}>Sleep Stages</Text>
        <SleepStagesBar
          deep={sleepStages.deep}
          rem={sleepStages.rem}
          light={sleepStages.light}
          awake={sleepStages.awake}
        />
      </View>

      {/* Bedtime window */}
      {bedtimeWindow && (
        <View style={styles.bedtimeRow}>
          <Ionicons name="bed" size={14} color={palette.textMuted} />
          <Text style={styles.bedtimeText}>{bedtimeWindow}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  loadingText: {
    ...typography.caption,
    color: palette.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    ...typography.bodySmall,
    color: palette.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.label,
    color: palette.textMuted,
  },
  qualityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    ...typography.caption,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.monoBold,
    fontSize: 28,
    color: palette.textPrimary,
    letterSpacing: -1,
  },
  statLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: palette.subtle,
    marginHorizontal: 16,
  },
  stagesSection: {
    marginBottom: 16,
  },
  stagesSectionTitle: {
    ...typography.caption,
    color: palette.textMuted,
    marginBottom: 10,
  },
  bedtimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.subtle,
  },
  bedtimeText: {
    ...typography.caption,
    color: palette.textMuted,
  },
});

export default SleepSummaryCard;
