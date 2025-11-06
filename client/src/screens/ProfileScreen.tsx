import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

export const ProfileScreen: React.FC = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.heading}>Profile</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Professional Data</Text>
      <Text style={styles.cardBody}>
        Update your biometric integrations, preferred clinician, and emergency contact information from this secure view.
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
