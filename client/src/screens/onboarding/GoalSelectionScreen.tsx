import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GoalCard } from '../../components/GoalCard';
import { palette } from '../../theme/palette';
import { ONBOARDING_GOALS, type PrimaryGoal } from '../../types/onboarding';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type GoalSelectionScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'GoalSelection'
>;

const AUTO_ADVANCE_DELAY = 600; // ms after selection before advancing

export const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({ navigation }) => {
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoal | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectGoal = useCallback((goalId: string) => {
    // Clear any existing timer
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    setSelectedGoal(goalId as PrimaryGoal);

    // Auto-advance after delay
    autoAdvanceTimer.current = setTimeout(() => {
      navigation.navigate('WearableConnection', {
        selectedGoal: goalId as PrimaryGoal,
      });
    }, AUTO_ADVANCE_DELAY);
  }, [navigation]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

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
            We'll personalize your experience around this goal.
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
                selected={selectedGoal === goal.id}
                onSelect={handleSelectGoal}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
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
});
