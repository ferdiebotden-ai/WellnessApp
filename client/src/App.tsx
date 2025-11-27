import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeatureFlagsProvider } from './providers/FeatureFlagsProvider';
import { AuthProvider } from './providers/AuthProvider';
import { RootNavigator } from './navigation/RootNavigator';
import analytics from './services/AnalyticsService';
import { firebaseAuth } from './services/firebase';
import { revenueCat } from './services/RevenueCatService';
import { palette } from './theme/palette';

/**
 * Main App component.
 *
 * The app uses RootNavigator to conditionally render:
 * - AuthStackNavigator: When user is not authenticated (Sign In / Sign Up)
 * - OnboardingStackNavigator: When user is authenticated but hasn't completed onboarding
 * - MainStackContent: When user is authenticated and has completed onboarding
 *
 * This ensures users must log in before accessing the Health Dashboard.
 */
export const App: React.FC = () => {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    analytics
      .init()
      .then(() => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
          void analytics.identifyUser(currentUser.uid, { email: currentUser.email ?? null });
        }
      })
      .catch((error) => {
        console.warn('Failed to initialize analytics service', error);
      });

    const currentUser = firebaseAuth.currentUser;
    void revenueCat.configure(currentUser?.uid ?? null).catch((error) => {
      console.warn('Failed to configure RevenueCat SDK', error);
    });

    if (typeof firebaseAuth.onAuthStateChanged === 'function') {
      unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
        void revenueCat.configure(user?.uid ?? null).catch((error) => {
          console.warn('Failed to synchronize RevenueCat user state', error);
        });

        if (user) {
          void analytics.identifyUser(user.uid, { email: user.email ?? null });
        }
      });
    }

    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <FeatureFlagsProvider>
        <AuthProvider>
          <StatusBar barStyle="light-content" backgroundColor={palette.background} />
          <RootNavigator />
        </AuthProvider>
      </FeatureFlagsProvider>
    </SafeAreaProvider>
  );
};

export default App;
