import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

export const ProtocolsScreen: React.FC = () => (
  <ScrollView contentContainerStyle={styles.container} testID="protocols-screen">
    <Text style={styles.heading}>Protocols</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Precision Recovery</Text>
      <Text style={styles.cardBody}>
        Review all assigned recovery and performance protocols. New clinician directives will appear here in real-time.
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
