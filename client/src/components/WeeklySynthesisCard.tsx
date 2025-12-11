import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import type { WeeklySynthesis } from '../hooks/useWeeklySynthesis';

interface Props {
  synthesis: WeeklySynthesis;
}

/**
 * Section component for individual synthesis insights
 */
interface SectionProps {
  title: string;
  content: string | null;
  icon: string;
  accentColor: string;
}

const SynthesisSection: React.FC<SectionProps> = ({ title, content, icon, accentColor }) => {
  if (!content) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionIcon, { color: accentColor }]}>{icon}</Text>
        <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );
};

/**
 * Displays weekly synthesis narrative with 5 sections.
 * Per PRD Section 4.5 - Weekly Synthesis structure:
 * - WIN: What improved this week
 * - WATCH: What needs attention
 * - PATTERN: Correlation discovery
 * - TRAJECTORY: Where trends are heading
 * - EXPERIMENT: Actionable suggestion for next week
 */
export const WeeklySynthesisCard: React.FC<Props> = ({ synthesis }) => {
  // Format the week range for display
  const weekStart = new Date(synthesis.week_start);
  const weekEnd = new Date(synthesis.week_end);
  const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  // Metrics summary for context
  const adherencePercent = synthesis.metrics.protocol_adherence?.toFixed(0) ?? '—';
  const recoveryScore = synthesis.metrics.avg_recovery_score?.toFixed(0) ?? '—';

  return (
    <View style={styles.container} accessibilityRole="summary" accessibilityLabel="Weekly synthesis">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.weekLabel}>{weekRange}</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricBadge}>
            <Text style={styles.metricValue}>{adherencePercent}%</Text>
            <Text style={styles.metricLabel}>Adherence</Text>
          </View>
          <View style={styles.metricBadge}>
            <Text style={styles.metricValue}>{recoveryScore}</Text>
            <Text style={styles.metricLabel}>Avg Recovery</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* 5 Synthesis Sections */}
      <View style={styles.sectionsContainer}>
        <SynthesisSection
          title="WIN"
          content={synthesis.win_of_week}
          icon="★"
          accentColor={palette.success}
        />

        <SynthesisSection
          title="WATCH"
          content={synthesis.area_to_watch}
          icon="⚠"
          accentColor={palette.accent}
        />

        <SynthesisSection
          title="PATTERN"
          content={synthesis.pattern_insight}
          icon="↗"
          accentColor={palette.secondary}
        />

        <SynthesisSection
          title="TRAJECTORY"
          content={synthesis.trajectory_prediction}
          icon="→"
          accentColor={palette.textSecondary}
        />

        <SynthesisSection
          title="EXPERIMENT"
          content={synthesis.experiment}
          icon="◉"
          accentColor={palette.primary}
        />
      </View>

      {/* Generated timestamp */}
      <Text style={styles.timestamp}>
        Generated {new Date(synthesis.generated_at).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </Text>
    </View>
  );
};

/**
 * Empty state when synthesis isn't available yet
 */
interface EmptyStateProps {
  daysTracked: number;
  minDaysRequired: number;
}

export const WeeklySynthesisEmptyState: React.FC<EmptyStateProps> = ({
  daysTracked,
  minDaysRequired,
}) => {
  const daysRemaining = Math.max(0, minDaysRequired - daysTracked);
  const progressPercent = Math.min(100, (daysTracked / minDaysRequired) * 100);

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>Weekly Synthesis Coming Soon</Text>
      <Text style={styles.emptyBody}>
        {daysTracked === 0
          ? `Complete protocols for ${minDaysRequired} days to unlock your first weekly synthesis.`
          : daysRemaining > 0
            ? `${daysRemaining} more day${daysRemaining === 1 ? '' : 's'} of data needed for your first synthesis.`
            : 'Your synthesis will generate on Sunday morning.'}
      </Text>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressTrack, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {daysTracked}/{minDaysRequired} days tracked
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  weekLabel: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricBadge: {
    backgroundColor: palette.elevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  metricValue: {
    ...typography.subheading,
    color: palette.primary,
    fontWeight: '700',
  },
  metricLabel: {
    ...typography.caption,
    color: palette.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 4,
  },
  sectionsContainer: {
    gap: 16,
  },
  section: {
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionIcon: {
    fontSize: 14,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionContent: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 22,
    paddingLeft: 20,
  },
  timestamp: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  // Empty state styles
  emptyContainer: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
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
  progressLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
  },
});
