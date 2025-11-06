import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

export const InsightsScreen: React.FC = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.heading}>Insights</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Coaching Insight</Text>
      <Text style={styles.cardBody}>
        Your HRV stability indicates readiness for higher intensity work today. Pair breathwork with progressive overload
        for optimal adaptation.
      </Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: palette.background,
    padding: 24,
    gap: 16,
  },
  heading: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  cardBody: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
});
