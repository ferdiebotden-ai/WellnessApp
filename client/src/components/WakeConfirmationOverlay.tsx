/**
 * Wake Confirmation Overlay
 *
 * Lightweight modal shown when phone unlock is detected.
 * For Lite Mode users: Shows a quick 3-question check-in after confirmation.
 * For wearable users: Directly confirms wake for Morning Anchor.
 *
 * Design: Dark overlay with centered card, matching Apex OS aesthetic.
 * Premium feel with refined animations and intentional typography.
 *
 * @file client/src/components/WakeConfirmationOverlay.tsx
 * @author Claude Opus 4.5 (Session 49)
 * @updated December 5, 2025
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import { CheckInQuestionnaire } from './CheckInQuestionnaire';
import type { ManualCheckInInput } from '../types/checkIn';

// =============================================================================
// TYPES
// =============================================================================

type OverlayMode = 'confirm' | 'questionnaire' | 'complete';

interface Props {
  /**
   * Whether the overlay is visible.
   */
  visible: boolean;

  /**
   * Whether user is in Lite Mode (no wearable).
   * If true, shows questionnaire after confirmation.
   */
  isLiteMode?: boolean;

  /**
   * Called when user taps "Let's Go" to confirm they're awake.
   * For non-Lite Mode users, this completes the flow.
   */
  onConfirm: () => void;

  /**
   * Called when Lite Mode user completes the check-in questionnaire.
   */
  onCheckInComplete?: (answers: ManualCheckInInput) => Promise<void>;

  /**
   * Called when user taps "Later" to snooze.
   */
  onLater: () => void;

  /**
   * Called when user dismisses by tapping outside.
   */
  onDismiss: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const WakeConfirmationOverlay: React.FC<Props> = ({
  visible,
  isLiteMode = false,
  onConfirm,
  onCheckInComplete,
  onLater,
  onDismiss,
}) => {
  const [mode, setMode] = useState<OverlayMode>('confirm');

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);

  // Reset mode when overlay closes
  useEffect(() => {
    if (!visible) {
      // Delay reset to allow exit animation
      const timer = setTimeout(() => {
        setMode('confirm');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      cardScale.value = withSpring(1, { damping: 20, stiffness: 300 });
      cardOpacity.value = withTiming(1, { duration: 200 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.9, { duration: 150 });
      cardOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, overlayOpacity, cardScale, cardOpacity]);

  // Checkmark animation for completion
  useEffect(() => {
    if (mode === 'complete') {
      checkmarkScale.value = withSequence(
        withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(2)) }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      checkmarkOpacity.value = withTiming(1, { duration: 150 });

      // Auto-dismiss after showing completion
      const timer = setTimeout(() => {
        onDismiss();
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      checkmarkScale.value = 0;
      checkmarkOpacity.value = 0;
    }
  }, [mode, checkmarkScale, checkmarkOpacity, onDismiss]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
    transform: [{ scale: checkmarkScale.value }],
  }));

  const handleConfirm = useCallback(() => {
    if (isLiteMode) {
      // Show questionnaire for Lite Mode users
      setMode('questionnaire');
    } else {
      // Direct confirmation for wearable users
      onConfirm();
    }
  }, [isLiteMode, onConfirm]);

  const handleCheckInComplete = useCallback(
    async (answers: ManualCheckInInput) => {
      if (onCheckInComplete) {
        await onCheckInComplete(answers);
      }
      setMode('complete');
      onConfirm(); // Also trigger the wake confirmation
    },
    [onCheckInComplete, onConfirm]
  );

  const handleSkip = useCallback(() => {
    // Skip check-in, but still confirm wake
    onConfirm();
    onDismiss();
  }, [onConfirm, onDismiss]);

  const handleLater = useCallback(() => {
    onLater();
  }, [onLater]);

  const handleBackdropPress = useCallback(() => {
    // Only allow backdrop dismiss in confirm mode
    if (mode === 'confirm') {
      onDismiss();
    }
  }, [mode, onDismiss]);

  // Get greeting based on time
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Render confirmation content
  const renderConfirmContent = () => (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      {/* Greeting */}
      <Text style={styles.greeting}>{getGreeting()}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Ready for your Morning Anchor?
      </Text>

      {/* Description */}
      <Text style={styles.description}>
        {isLiteMode
          ? 'Quick check-in to personalize your morning protocol.'
          : 'Start your day with a personalized protocol based on your readiness.'}
      </Text>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleConfirm}
        >
          <Text style={styles.primaryButtonText}>
            {isLiteMode ? 'Quick Check-in' : "Let's Go"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLater}
        >
          <Text style={styles.secondaryButtonText}>Later</Text>
        </Pressable>
      </View>

      {/* Dismiss hint */}
      <Text style={styles.dismissHint}>
        Tap outside to skip for today
      </Text>
    </Animated.View>
  );

  // Render questionnaire content
  const renderQuestionnaireContent = () => (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.questionnaireContainer}
    >
      {/* Header */}
      <Text style={styles.questionnaireHeader}>Morning Check-in</Text>
      <Text style={styles.questionnaireSubtext}>3 quick questions</Text>

      {/* Questionnaire */}
      <CheckInQuestionnaire
        onComplete={handleCheckInComplete}
        onSkip={handleSkip}
      />
    </Animated.View>
  );

  // Render completion content
  const renderCompleteContent = () => (
    <View style={styles.completeContainer}>
      {/* Checkmark */}
      <Animated.View style={[styles.checkmarkContainer, checkmarkStyle]}>
        <Text style={styles.checkmarkEmoji}>✓</Text>
      </Animated.View>

      {/* Message */}
      <Text style={styles.completeTitle}>Check-in Complete</Text>
      <Text style={styles.completeSubtext}>
        Your personalized score is ready
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                cardStyle,
                mode === 'questionnaire' && styles.cardExpanded,
              ]}
            >
              {mode === 'confirm' && renderConfirmContent()}
              {mode === 'questionnaire' && renderQuestionnaireContent()}
              {mode === 'complete' && renderCompleteContent()}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    // Subtle shadow for depth
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  cardExpanded: {
    paddingVertical: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    color: palette.primary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: palette.background,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryButtonText: {
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  dismissHint: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.2,
  },

  // Questionnaire styles
  questionnaireContainer: {
    width: '100%',
    alignItems: 'center',
  },
  questionnaireHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  questionnaireSubtext: {
    fontSize: 13,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Complete styles
  completeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  checkmarkContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${palette.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  checkmarkEmoji: {
    fontSize: 32,
    color: palette.primary,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSubtext: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
  },
});

export default WakeConfirmationOverlay;
