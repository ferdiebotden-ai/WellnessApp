import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import type { OnboardingGoal } from '../types/onboarding';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GoalCardProps {
  goal: OnboardingGoal;
  selected: boolean;
  onSelect: (goalId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, selected, onSelect }) => {
  const scale = useSharedValue(1);
  const borderProgress = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    borderProgress.value = withSpring(selected ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [selected, borderProgress]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(
      borderProgress.value,
      [0, 1],
      [palette.border, palette.primary]
    ),
    // Only apply animated shadow on native platforms (web uses boxShadow)
    ...(Platform.OS !== 'web' && { shadowOpacity: borderProgress.value * 0.4 }),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${goal.label}: ${goal.description}`}
      onPress={() => onSelect(goal.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      <Text style={styles.icon}>{goal.icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{goal.label}</Text>
        <Text style={styles.description}>{goal.description}</Text>
      </View>
      {selected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.border,
    marginBottom: 12,
    // Native-only shadow props (animated via shadowOpacity)
    ...Platform.select({
      ios: {
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        shadowOpacity: 0,
      },
      android: { elevation: 0 },
      default: {}, // Web: no shadow props needed
    }),
  },
  icon: {
    fontSize: 40,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmark: {
    color: palette.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
