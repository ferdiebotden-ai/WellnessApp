/**
 * SuggestionCard
 *
 * A vertical card for AI Coach suggested questions.
 * Displays question text with description and icon.
 * Tap triggers immediate question submission.
 *
 * Session 90: AI Coach UX Enhancement
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';
import { haptic } from '../../utils/haptics';

export interface SuggestionCardProps {
  question: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  question,
  description,
  icon,
  onPress,
  disabled = false,
}) => {
  const handlePress = () => {
    void haptic.light();
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        disabled && styles.cardDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      testID="suggestion-card"
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={22}
          color={disabled ? palette.textMuted : palette.primary}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.question, disabled && styles.textDisabled]}>
          {question}
        </Text>
        <Text style={[styles.description, disabled && styles.textDisabled]}>
          {description}
        </Text>
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={disabled ? palette.textMuted : palette.textSecondary}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    marginBottom: 12,
  },
  cardPressed: {
    backgroundColor: palette.elevated,
    borderColor: palette.primary,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  question: {
    ...typography.body,
    color: palette.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    ...typography.caption,
    color: palette.textSecondary,
    lineHeight: 18,
  },
  textDisabled: {
    color: palette.textMuted,
  },
  arrowContainer: {
    marginLeft: 12,
  },
});

export default SuggestionCard;
