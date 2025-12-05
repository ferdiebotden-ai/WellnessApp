/**
 * Check-in Questionnaire Component
 *
 * A 3-step quick check-in flow for Lite Mode users:
 * 1. Sleep Quality (1-5 with emojis)
 * 2. Sleep Hours (categorical options)
 * 3. Energy Level (1-5 with emojis)
 *
 * Features:
 * - Tappable options (no sliders for speed)
 * - Auto-advance on selection
 * - Progress indicator (dots)
 * - Skip option
 *
 * @file client/src/components/CheckInQuestionnaire.tsx
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import {
  ManualCheckInInput,
  QualityRating,
  SleepHoursOption,
  QUESTIONNAIRE_QUESTIONS,
  QuestionnaireStep,
} from '../types/checkIn';

// =============================================================================
// TYPES
// =============================================================================

interface Props {
  /**
   * Called when user completes all 3 questions.
   */
  onComplete: (answers: ManualCheckInInput) => Promise<void>;

  /**
   * Called when user taps "Skip for today".
   */
  onSkip: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CheckInQuestionnaire: React.FC<Props> = ({ onComplete, onSkip }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<ManualCheckInInput>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = QUESTIONNAIRE_QUESTIONS[stepIndex];
  const totalSteps = QUESTIONNAIRE_QUESTIONS.length;

  const handleOptionPress = useCallback(
    async (value: QualityRating | SleepHoursOption) => {
      const step = currentQuestion.step;

      // Update answers
      const newAnswers = { ...answers };
      if (step === 'sleepQuality') {
        newAnswers.sleepQuality = value as QualityRating;
      } else if (step === 'sleepHours') {
        newAnswers.sleepHours = value as SleepHoursOption;
      } else if (step === 'energyLevel') {
        newAnswers.energyLevel = value as QualityRating;
      }
      setAnswers(newAnswers);

      // Auto-advance or complete
      if (stepIndex < totalSteps - 1) {
        // Short delay for visual feedback before advancing
        setTimeout(() => {
          setStepIndex(stepIndex + 1);
        }, 200);
      } else {
        // Last question - submit
        setIsSubmitting(true);
        try {
          await onComplete(newAnswers as ManualCheckInInput);
        } catch (error) {
          console.error('[CheckInQuestionnaire] Submit error:', error);
          setIsSubmitting(false);
        }
      }
    },
    [answers, currentQuestion, stepIndex, totalSteps, onComplete]
  );

  // Render progress dots
  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {QUESTIONNAIRE_QUESTIONS.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === stepIndex && styles.progressDotActive,
            index < stepIndex && styles.progressDotComplete,
          ]}
        />
      ))}
    </View>
  );

  // Render option button
  const renderOption = (option: {
    value: QualityRating | SleepHoursOption;
    label: string;
    emoji?: string;
  }) => {
    const isSelected =
      (currentQuestion.step === 'sleepQuality' && answers.sleepQuality === option.value) ||
      (currentQuestion.step === 'sleepHours' && answers.sleepHours === option.value) ||
      (currentQuestion.step === 'energyLevel' && answers.energyLevel === option.value);

    return (
      <Pressable
        key={String(option.value)}
        style={({ pressed }) => [
          styles.optionButton,
          isSelected && styles.optionButtonSelected,
          pressed && styles.optionButtonPressed,
        ]}
        onPress={() => handleOptionPress(option.value)}
        disabled={isSubmitting}
      >
        {option.emoji && <Text style={styles.optionEmoji}>{option.emoji}</Text>}
        <Text
          style={[
            styles.optionLabel,
            isSelected && styles.optionLabelSelected,
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  };

  if (isSubmitting) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Calculating your score...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Dots */}
      {renderProgressDots()}

      {/* Question */}
      <Animated.View
        key={stepIndex}
        entering={SlideInRight.duration(200)}
        exiting={SlideOutLeft.duration(200)}
        style={styles.questionContainer}
      >
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map(renderOption)}
        </View>
      </Animated.View>

      {/* Skip Link */}
      <Pressable
        style={({ pressed }) => [
          styles.skipButton,
          pressed && styles.skipButtonPressed,
        ]}
        onPress={onSkip}
      >
        <Text style={styles.skipText}>Skip for today</Text>
      </Pressable>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.border,
  },
  progressDotActive: {
    backgroundColor: palette.primary,
    width: 24,
  },
  progressDotComplete: {
    backgroundColor: palette.primary,
  },
  questionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    minWidth: 56,
  },
  optionButtonSelected: {
    backgroundColor: `${palette.primary}20`,
    borderColor: palette.primary,
  },
  optionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textSecondary,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: palette.primary,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipText: {
    fontSize: 14,
    color: palette.textMuted,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: palette.textSecondary,
  },
});

export default CheckInQuestionnaire;
