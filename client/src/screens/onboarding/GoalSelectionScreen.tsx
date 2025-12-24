/**
 * GoalSelectionScreen
 *
 * Multi-select goal picker for onboarding.
 * Users can select one or more wellness goals.
 *
 * Session 83: Multi-focus area selection
 */

import React, { useCallback, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GoalCard } from '../../components/GoalCard';
import { palette } from '../../theme/palette';
import { tokens } from '../../theme/tokens';
import { haptic } from '../../utils/haptics';
import { ONBOARDING_GOALS, type PrimaryGoal } from '../../types/onboarding';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type GoalSelectionScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'GoalSelection'
>;

export const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({ navigation }) => {
  const [selectedGoals, setSelectedGoals] = useState<Set<PrimaryGoal>>(new Set());

  const handleToggleGoal = useCallback((goalId: string) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      const goal = goalId as PrimaryGoal;
      if (next.has(goal)) {
        next.delete(goal);
        void haptic.light();
      } else {
        next.add(goal);
        void haptic.medium();
      }
      return next;
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedGoals.size === 0) return;

    void haptic.success();
    navigation.navigate('StarterProtocolSelection', {
      selectedGoals: Array.from(selectedGoals),
    });
  }, [navigation, selectedGoals]);

  const canContinue = selectedGoals.size > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.header}
        >
          <Text style={styles.question}>What matters most right now?</Text>
          <Text style={styles.subtitle}>
            Select one or more goals. We'll personalize your protocols around these focus areas.
          </Text>
        </Animated.View>

        <View style={styles.goalsContainer}>
          {ONBOARDING_GOALS.map((goal, index) => (
            <Animated.View
              key={goal.id}
              entering={FadeInDown.duration(500).delay(200 + index * 100)}
            >
              <GoalCard
                goal={goal}
                selected={selectedGoals.has(goal.id)}
                onSelect={handleToggleGoal}
                multiSelect
              />
            </Animated.View>
          ))}
        </View>

        {/* Selection Summary */}
        {selectedGoals.size > 0 && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={styles.selectionSummary}
          >
            <Text style={styles.summaryText}>
              {selectedGoals.size} goal{selectedGoals.size > 1 ? 's' : ''} selected
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(600)}
        style={styles.footer}
      >
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
            pressed && canContinue && styles.continueButtonPressed,
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to protocol selection"
          accessibilityState={{ disabled: !canContinue }}
        >
          <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={canContinue ? palette.background : palette.textMuted}
          />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 140,
  },
  header: {
    marginBottom: 32,
  },
  question: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 24,
  },
  goalsContainer: {
    gap: 0, // Handled by marginBottom in GoalCard
  },
  selectionSummary: {
    marginTop: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.elevated,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    borderRadius: tokens.radius.lg,
    paddingVertical: 16,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.background,
  },
  continueButtonTextDisabled: {
    color: palette.textMuted,
  },
});
