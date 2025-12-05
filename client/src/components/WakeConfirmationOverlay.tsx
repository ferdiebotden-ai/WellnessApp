/**
 * Wake Confirmation Overlay
 *
 * Lightweight modal shown to Lite Mode users when phone unlock is detected.
 * Allows user to confirm they're awake and ready for Morning Anchor.
 *
 * Design: Dark overlay with centered card, matching Apex OS aesthetic.
 *
 * @file client/src/components/WakeConfirmationOverlay.tsx
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

import React, { useCallback, useEffect } from 'react';
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
  runOnJS,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

// =============================================================================
// TYPES
// =============================================================================

interface Props {
  /**
   * Whether the overlay is visible.
   */
  visible: boolean;

  /**
   * Called when user taps "Let's Go" to confirm they're awake.
   */
  onConfirm: () => void;

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
  onConfirm,
  onLater,
  onDismiss,
}) => {
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

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

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleLater = useCallback(() => {
    onLater();
  }, [onLater]);

  const handleBackdropPress = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Get greeting based on time
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

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
            <Animated.View style={[styles.card, cardStyle]}>
              {/* Greeting */}
              <Text style={styles.greeting}>{getGreeting()}</Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Ready for your Morning Anchor?
              </Text>

              {/* Description */}
              <Text style={styles.description}>
                Start your day with a personalized protocol based on your readiness.
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
                  <Text style={styles.primaryButtonText}>Let's Go</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: palette.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: palette.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryButtonText: {
    color: palette.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  dismissHint: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default WakeConfirmationOverlay;
