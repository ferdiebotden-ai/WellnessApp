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
      <View style={styles.cardContent}>
        <Text style={styles.icon}>{wearable.icon}</Text>
        <Text style={styles.name}>{wearable.name}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    width: '100%',
    minHeight: 72,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    fontSize: 32,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  chevron: {
    fontSize: 24,
    color: palette.textMuted,
    fontWeight: '300',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.border,
    marginTop: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  skipSubtext: {
    fontSize: 13,
    color: palette.textMuted,
  },
});
