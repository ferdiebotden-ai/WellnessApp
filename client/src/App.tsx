import React, { useEffect } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { Alert, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { BottomTabs } from './navigation/BottomTabs';
import { TopNavigationBar } from './components/TopNavigationBar';
import { palette } from './theme/palette';
import { AppLockProvider } from './providers/AppLockProvider';
import { AuthenticationGate } from './components/AuthenticationGate';
import { MonetizationProvider, useMonetization } from './providers/MonetizationProvider';
import { TrialBanner } from './components/TrialBanner';
import { TrialSoftReminderModal } from './components/TrialSoftReminderModal';
import { PaywallModal } from './components/PaywallModal';
import analytics from './services/AnalyticsService';
import { firebaseAuth } from './services/firebase';
import { revenueCat } from './services/RevenueCatService';

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

const AppScaffold: React.FC = () => {
  const { requestChatAccess, refreshStatus, closePaywall } = useMonetization();

  const handleAiCoachPress = () => {
    const allowed = requestChatAccess({ intent: 'quick_access' });
    if (!allowed) {
      return;
    }

    Alert.alert('AI Coach', 'The AI Coach will be available soon.');
  };

  const handleSubscribe = async () => {
    try {
      await analytics.trackSubscriptionStarted();
      const purchase = await revenueCat.purchaseCorePackage();

      if (!revenueCat.hasActiveCoreEntitlement(purchase.customerInfo)) {
        throw new Error('Core entitlement was not activated.');
      }

      await analytics.trackSubscriptionActivated({
        productIdentifier: purchase.productIdentifier,
      });

      await refreshStatus();
      closePaywall();

      Alert.alert(
        'Welcome to Core',
        'Your subscription is active. Enjoy unlimited coaching and premium modules.'
      );
    } catch (error) {
      if (revenueCat.isUserCancellationError(error)) {
        Alert.alert('Purchase cancelled', 'No charges were made to your account.');
        return;
      }

      console.error('Core subscription purchase failed', error);
      Alert.alert(
        'Purchase failed',
        'We were unable to complete your purchase. Please try again in a few minutes.'
      );
    }
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <TopNavigationBar
          title="Health Dashboard"
          subtitle="Wellness OS"
          onAiCoachPress={handleAiCoachPress}
        />
        <TrialBanner />
        <View style={styles.contentWrapper}>
          <BottomTabs />
        </View>
      </SafeAreaView>
      <TrialSoftReminderModal />
      <PaywallModal onSubscribe={handleSubscribe} />
    </NavigationContainer>
  );
};

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
    <AppLockProvider>
      <AuthenticationGate>
        <MonetizationProvider>
          <AppScaffold />
        </MonetizationProvider>
      </AuthenticationGate>
    </AppLockProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  contentWrapper: {
    flex: 1,
  },
});
