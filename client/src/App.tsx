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
  const { requestChatAccess } = useMonetization();

  const handleAiCoachPress = () => {
    const allowed = requestChatAccess({ intent: 'quick_access' });
    if (!allowed) {
      return;
    }

    Alert.alert('AI Coach', 'The AI Coach will be available soon.');
  };

  const handleSubscribe = () => {
    void analytics.trackSubscriptionStarted();
    Alert.alert('Upgrade to Core', 'Subscription checkout is handled in MISSION_023.');
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

    if (typeof firebaseAuth.onAuthStateChanged === 'function') {
      unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
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
