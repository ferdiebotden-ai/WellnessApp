/**
 * CompletionModal
 *
 * Modal shown when marking a protocol as complete.
 * Allows user to rate difficulty (1-5 stars) and add optional notes.
 *
 * Session 59: Protocol Data Enrichment & Personalization
 */

import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';

interface CompletionModalProps {
  visible: boolean;
  protocolName: string;
  onComplete: (difficultyRating: number | null, notes: string | null) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  protocolName,
  onComplete,
  onSkip,
  onCancel,
}) => {
  const [rating, setRating] = useState<number>(3); // Default to 3 (neutral)
  const [notes, setNotes] = useState<string>('');

  const handleComplete = useCallback(() => {
    onComplete(rating, notes.trim() || null);
    // Reset state for next use
    setRating(3);
    setNotes('');
  }, [rating, notes, onComplete]);

  const handleSkip = useCallback(() => {
    onSkip();
    // Reset state for next use
    setRating(3);
    setNotes('');
  }, [onSkip]);

  const handleCancel = useCallback(() => {
    onCancel();
    // Reset state for next use
    setRating(3);
    setNotes('');
  }, [onCancel]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleCancel} />
        <View style={styles.modal}>
          <Text style={styles.title}>Log Completion</Text>
          <Text style={styles.subtitle}>{protocolName}</Text>

          {/* Difficulty Rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>How difficult was this?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${star} out of 5`}
                  accessibilityState={{ selected: star <= rating }}
                >
                  <Text
                    style={[
                      styles.starText,
                      star <= rating && styles.starTextActive,
                    ]}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.ratingHints}>
              <Text style={styles.hintText}>Easy</Text>
              <Text style={styles.hintText}>Hard</Text>
            </View>
          </View>

          {/* Notes Input */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it go? Any adjustments?"
              placeholderTextColor={palette.textMuted}
              multiline
              maxLength={280}
              textAlignVertical="top"
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.completeButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </Pressable>
            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip rating</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    ...typography.subheading,
    color: palette.textSecondary,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 8,
  },
  starText: {
    fontSize: 32,
    color: palette.elevated,
  },
  starTextActive: {
    color: palette.accent,
  },
  ratingHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  hintText: {
    ...typography.caption,
    color: palette.textMuted,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    ...typography.subheading,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: palette.elevated,
    borderRadius: 12,
    padding: 12,
    ...typography.body,
    color: palette.textPrimary,
    minHeight: 80,
  },
  actions: {
    gap: 8,
  },
  completeButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  completeButtonText: {
    ...typography.subheading,
    color: palette.background,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.body,
    color: palette.textMuted,
  },
});
