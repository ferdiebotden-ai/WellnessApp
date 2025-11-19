import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ModuleOnboardingScreen } from '../screens/ModuleOnboardingScreen';
import { BiometricSetupScreen } from '../screens/auth/BiometricSetupScreen';
import { palette } from '../theme/palette';

export type OnboardingStackParamList = {
  ModuleOnboarding: undefined;
  BiometricSetup: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Navigation stack for authenticated users who haven't completed onboarding.
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
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
    </Stack.Navigator>
  );
};

