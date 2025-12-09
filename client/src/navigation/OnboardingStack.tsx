import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AICoachIntroScreen,
  GoalSelectionScreen,
  BiometricProfileScreen,
  WearableConnectionScreen,
} from '../screens/onboarding';
import { palette } from '../theme/palette';
import type { PrimaryGoal, BiometricProfileData } from '../types/onboarding';

export type OnboardingStackParamList = {
  AICoachIntro: undefined;
  GoalSelection: undefined;
  BiometricProfile: { selectedGoal: PrimaryGoal };
  WearableConnection: { selectedGoal: PrimaryGoal; biometrics?: BiometricProfileData };
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Navigation stack for authenticated users who haven't completed onboarding.
 *
 * Flow: AI Intro → Goal Selection → Biometric Profile → Wearable Connection → Main app
 *
 * Design: Conversational AI onboarding with typographic/cinematic intro,
 * tap-to-advance goal selection, optional biometric profile (age, sex, height, weight),
 * and optional wearable connection.
 *
 * Note: No trial language - users go directly into the app experience.
 */
export const OnboardingStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AICoachIntro"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
        animation: 'fade',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="AICoachIntro" component={AICoachIntroScreen} />
      <Stack.Screen
        name="GoalSelection"
        component={GoalSelectionScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="BiometricProfile"
        component={BiometricProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WearableConnection"
        component={WearableConnectionScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};
