import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import type { OnboardingWearable } from '../types/onboarding';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface WearableCardProps {
  wearable: OnboardingWearable;
  onSelect: (wearableId: string) => void;
}

export const WearableCard: React.FC<WearableCardProps> = ({ wearable, onSelect }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Connect ${wearable.name}`}
      onPress={() => onSelect(wearable.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      <Text style={styles.icon}>{wearable.icon}</Text>
      <Text style={styles.name}>{wearable.name}</Text>
    </AnimatedPressable>
  );
};

interface SkipButtonProps {
  onPress: () => void;
}

export const SkipButton: React.FC<SkipButtonProps> = ({ onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Skip wearable connection for now"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.skipButton, animatedStyle]}
    >
      <Text style={styles.skipText}>Skip for now</Text>
      <Text style={styles.skipSubtext}>You can add this later in Settings</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    width: '48%',
    aspectRatio: 1,
    marginBottom: 12,
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    textAlign: 'center',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: palette.primary,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  skipText: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.primary,
    marginBottom: 4,
  },
  skipSubtext: {
    fontSize: 13,
    color: palette.textMuted,
  },
});
