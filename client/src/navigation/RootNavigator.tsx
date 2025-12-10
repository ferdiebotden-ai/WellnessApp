import React from 'react';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { useAuth } from '../providers/AuthProvider';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthStackNavigator } from './AuthStack';
import { OnboardingStackNavigator } from './OnboardingStack';
import { MainStackContent } from './MainStack';
import { palette } from '../theme/palette';

/**
 * Deep linking configuration for the app.
 * Enables URL-based navigation for notification taps and external links.
 * URL scheme: wellnessos:// (defined in app.json)
 *
 * Examples:
 * - wellnessos://home → Home screen
 * - wellnessos://protocol/123 → ProtocolDetail with protocolId
 * - wellnessos://protocols → Protocol browser
 * - wellnessos://insights → Insights tab
 * - wellnessos://profile → Profile tab
 *
 * Session 65: Added for push notification deep linking support.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: LinkingOptions<any> = {
  prefixes: [
    'wellnessos://',
    'https://app.apexos.com', // For future web deep links
  ],
  config: {
    screens: {
      // Main tabs (when authenticated)
      Home: {
        screens: {
          Home: 'home',
          ProtocolBrowser: 'protocols',
          ProtocolDetail: {
            path: 'protocol/:protocolId',
            parse: {
              protocolId: (protocolId: string) => protocolId,
            },
          },
          Waitlist: 'waitlist/:tier/:moduleName',
        },
      },
      Protocols: 'browse',
      Insights: 'insights',
      Profile: {
        screens: {
          ProfileMain: 'profile',
          PrivacyDashboard: 'privacy',
          WearableSettings: 'settings/wearables',
          CalendarSettings: 'settings/calendar',
          BiometricSettings: 'settings/biometrics',
        },
      },
      // Auth screens (when unauthenticated)
      SignIn: 'signin',
      SignUp: 'signup',
      ForgotPassword: 'forgot-password',
    },
  },
};

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
    <NavigationContainer theme={navigationTheme} linking={linking}>
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

