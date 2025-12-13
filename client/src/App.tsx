import React, { useEffect, useCallback } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { FeatureFlagsProvider } from './providers/FeatureFlagsProvider';
import { AuthProvider } from './providers/AuthProvider';
import { RootNavigator } from './navigation/RootNavigator';
import analytics from './services/AnalyticsService';
import { firebaseAuth } from './services/firebase';
import { revenueCat } from './services/RevenueCatService';
import { palette } from './theme/palette';
import { FullScreenLoading } from './components/ui/ApexLoadingIndicator';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

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
  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

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

  // Hide splash screen when fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Show loading state while fonts are loading
  if (!fontsLoaded) {
    return <FullScreenLoading />;
  }

  return (
    <SafeAreaProvider>
      <FeatureFlagsProvider>
        <AuthProvider>
          <View style={styles.container} onLayout={onLayoutRootView}>
            <StatusBar barStyle="light-content" backgroundColor={palette.background} />
            <RootNavigator />
          </View>
        </AuthProvider>
      </FeatureFlagsProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
