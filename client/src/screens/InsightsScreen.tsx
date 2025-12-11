import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { useCorrelations } from '../hooks/useCorrelations';
import { useWeeklySynthesis } from '../hooks/useWeeklySynthesis';
import { CorrelationCard } from '../components/CorrelationCard';
import { EmptyCorrelationState } from '../components/EmptyCorrelationState';
import { WeeklySynthesisCard, WeeklySynthesisEmptyState } from '../components/WeeklySynthesisCard';

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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>Loading synthesis...</Text>
          </View>
        ) : synthesisError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Unable to load synthesis. Please try again later.</Text>
          </View>
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>Loading patterns...</Text>
          </View>
        ) : correlationsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Unable to load patterns. Please try again later.</Text>
          </View>
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
    backgroundColor: palette.background,
    padding: 24,
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  correlationsList: {
    gap: 12,
  },
  loadingContainer: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  errorContainer: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    textAlign: 'center',
  },
});
