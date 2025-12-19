import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AICoachIntroScreen,
  GoalSelectionScreen,
  BiometricProfileScreen,
  WearableConnectionScreen,
  HealthDataSyncScreen,
  MagicMomentScreen,
} from '../screens/onboarding';
import { palette } from '../theme/palette';
import type {
  PrimaryGoal,
  BiometricProfileData,
  WearableSource,
  HealthPlatform,
} from '../types/onboarding';

export type OnboardingStackParamList = {
  AICoachIntro: undefined;
  GoalSelection: undefined;
  BiometricProfile: { selectedGoal: PrimaryGoal };
  WearableConnection: { selectedGoal: PrimaryGoal; biometrics?: BiometricProfileData };
  HealthDataSync: {
    selectedGoal: PrimaryGoal;
    biometrics?: BiometricProfileData;
    wearableSource?: WearableSource | null;
  };
  MagicMoment: {
    selectedGoal: PrimaryGoal;
    biometrics?: BiometricProfileData;
    wearableSource?: WearableSource | null;
    healthPlatform?: HealthPlatform | null;
  };
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Navigation stack for authenticated users who haven't completed onboarding.
 *
 * Flow: AI Intro → Goal Selection → Biometric Profile → Wearable Connection → Health Data Sync → Main app
 *
 * Design: Conversational AI onboarding with typographic/cinematic intro,
 * tap-to-advance goal selection, optional biometric profile (age, sex, height, weight),
 * optional wearable connection, and optional health platform sync.
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
      <Stack.Screen
        name="HealthDataSync"
        component={HealthDataSyncScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="MagicMoment"
        component={MagicMomentScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
};
