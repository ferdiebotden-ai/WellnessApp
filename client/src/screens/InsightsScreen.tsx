import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { useCorrelations } from '../hooks/useCorrelations';
import { CorrelationCard } from '../components/CorrelationCard';
import { EmptyCorrelationState } from '../components/EmptyCorrelationState';

/**
 * Insights Screen - Correlation Dashboard
 *
 * Displays protocol-outcome correlations from weekly synthesis.
 * Shows empty state for users with < 14 days of data.
 *
 * Design per PRD Section 5.8.
 */
export const InsightsScreen: React.FC = () => {
  const { correlations, daysTracked, minDaysRequired, loading, error } = useCorrelations();

  const hasEnoughData = daysTracked >= minDaysRequired;
  const hasCorrelations = correlations.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container} testID="insights-screen">
      {/* Section: Your Patterns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR PATTERNS</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>Loading patterns...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Unable to load patterns. Please try again later.</Text>
          </View>
        ) : !hasEnoughData || !hasCorrelations ? (
          <EmptyCorrelationState daysTracked={daysTracked} minDaysRequired={minDaysRequired} />
        ) : (
          <View style={styles.correlationsList}>
            {correlations.map((correlation) => (
              <CorrelationCard key={`${correlation.protocol}-${correlation.outcome}`} correlation={correlation} />
            ))}
          </View>
        )}
      </View>

      {/* Section: AI Coaching Insight (keep existing placeholder) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COACHING INSIGHT</Text>
        <View style={styles.card}>
          <Text style={styles.cardBody}>
            Your HRV stability indicates readiness for higher intensity work today. Pair breathwork
            with progressive overload for optimal adaptation.
          </Text>
        </View>
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
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardBody: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
});
