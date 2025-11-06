import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface Props {
  title: string;
  subtitle?: string;
  onAiCoachPress?: () => void;
}

export const TopNavigationBar: React.FC<Props> = ({ title, subtitle, onAiCoachPress }) => (
  <View style={styles.container}>
    <View style={styles.textGroup}>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
    <TouchableOpacity
      style={styles.aiCoachButton}
      onPress={onAiCoachPress}
      accessibilityRole="button"
      accessibilityLabel="Open AI coach"
      testID="ai-coach-button"
    >
      <Text style={styles.aiCoachText}>AI</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: palette.background,
  },
  textGroup: {
    gap: 4,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
  },
  aiCoachButton: {
    backgroundColor: palette.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  aiCoachText: {
    ...typography.subheading,
    color: palette.textPrimary,
    letterSpacing: 1,
  },
});
