import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { useCorrelations } from '../hooks/useCorrelations';
import { useWeeklySynthesis } from '../hooks/useWeeklySynthesis';
import { CorrelationCard } from '../components/CorrelationCard';
import { EmptyCorrelationState } from '../components/EmptyCorrelationState';
import { WeeklySynthesisCard, WeeklySynthesisEmptyState } from '../components/WeeklySynthesisCard';
import { ApexLoadingIndicator } from '../components/ui/ApexLoadingIndicator';
import { Card } from '../components/ui/Card';

/**
 * Insights Screen - Weekly Synthesis + Correlation Dashboard
 *
 * Displays:
 * 1. Weekly Synthesis - AI-generated 5-section narrative (Win, Watch, Pattern, Trajectory, Experiment)
 * 2. Protocol-outcome correlations from weekly synthesis
 *
 * Per PRD Section 4.5 (Weekly Synthesis) and Section 5.8 (Correlations).
 */
export const InsightsScreen: React.FC = () => {
  const { correlations, daysTracked: correlationDays, minDaysRequired: correlationMinDays, loading: correlationsLoading, error: correlationsError } = useCorrelations();
  const { hasSynthesis, synthesis, daysTracked: synthesisDays, minDaysRequired: synthesisMinDays, loading: synthesisLoading, error: synthesisError } = useWeeklySynthesis();

  const hasEnoughCorrelationData = correlationDays >= correlationMinDays;
  const hasCorrelations = correlations.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container} testID="insights-screen">
      {/* Section: Weekly Synthesis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WEEKLY SYNTHESIS</Text>

        {synthesisLoading ? (
          <Card style={styles.loadingContainer}>
            <ApexLoadingIndicator size={48} />
            <Text style={styles.loadingText}>Loading synthesis...</Text>
          </Card>
        ) : synthesisError ? (
          <Card style={styles.errorContainer}>
            <Text style={styles.errorText}>Unable to load synthesis. Please try again later.</Text>
          </Card>
        ) : hasSynthesis && synthesis ? (
          <WeeklySynthesisCard synthesis={synthesis} />
        ) : (
          <WeeklySynthesisEmptyState daysTracked={synthesisDays} minDaysRequired={synthesisMinDays} />
        )}
      </View>

      {/* Section: Your Patterns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR PATTERNS</Text>

        {correlationsLoading ? (
          <Card style={styles.loadingContainer}>
            <ApexLoadingIndicator size={48} />
            <Text style={styles.loadingText}>Loading patterns...</Text>
          </Card>
        ) : correlationsError ? (
          <Card style={styles.errorContainer}>
            <Text style={styles.errorText}>Unable to load patterns. Please try again later.</Text>
          </Card>
        ) : !hasEnoughCorrelationData || !hasCorrelations ? (
          <EmptyCorrelationState daysTracked={correlationDays} minDaysRequired={correlationMinDays} />
        ) : (
          <View style={styles.correlationsList}>
            {correlations.map((correlation) => (
              <CorrelationCard key={`${correlation.protocol}-${correlation.outcome}`} correlation={correlation} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: palette.canvas,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.xl,
  },
  section: {
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  correlationsList: {
    gap: tokens.spacing.md,
  },
  loadingContainer: {
    paddingVertical: tokens.spacing.xl,
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    textAlign: 'center',
  },
});
