import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../providers/AuthProvider';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthStackNavigator } from './AuthStack';
import { OnboardingStackNavigator } from './OnboardingStack';
import { MainStackContent } from './MainStack';
import { palette } from '../theme/palette';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.primary,
    background: palette.background,
    card: palette.background,
    text: palette.textPrimary,
    border: palette.border,
  },
};

/**
 * Root navigator that conditionally renders the appropriate navigation stack
 * based on authentication state and onboarding completion status.
 * Provides a single NavigationContainer at the root level for all navigation stacks.
 */
export const RootNavigator: React.FC = () => {
  const { state, onboardingStatus, user } = useAuth();

  console.log('🧭 RootNavigator render - Auth state:', state, 'Onboarding:', onboardingStatus, 'User:', user?.id);

  // Show splash screen while checking auth state
  if (state === 'loading') {
    console.log('⏳ Showing splash screen (auth loading)');
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {state === 'unauthenticated' ? (
        <AuthStackNavigator />
      ) : onboardingStatus === 'pending' ? (
        <>
          {console.log('📋 Showing OnboardingStack')}
          <OnboardingStackNavigator />
        </>
      ) : (
        <>
          {console.log('🏠 Showing MainStack')}
          <MainStackContent />
        </>
      )}
    </NavigationContainer>
  );
};

