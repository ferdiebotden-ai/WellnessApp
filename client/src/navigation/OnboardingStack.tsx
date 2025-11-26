import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ModuleOnboardingScreen } from '../screens/ModuleOnboardingScreen';
import { palette } from '../theme/palette';

export type OnboardingStackParamList = {
  ModuleOnboarding: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Navigation stack for authenticated users who haven't completed onboarding.
 *
 * Flow: Module selection → Main app
 *
 * Note: Biometric/PIN protection is an optional feature users can enable later
 * in Settings, following industry best practices (Headspace, Calm, Noom, etc.)
 */
export const OnboardingStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ModuleOnboarding"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="ModuleOnboarding" component={ModuleOnboardingScreen} />
    </Stack.Navigator>
  );
};

