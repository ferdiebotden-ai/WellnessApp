import React from 'react';
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
    const allowed = requestChatAccess();
    if (!allowed) {
      return;
    }

    Alert.alert('AI Coach', 'The AI Coach will be available soon.');
  };

  const handleSubscribe = () => {
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

export const App: React.FC = () => (
  <AppLockProvider>
    <MonetizationProvider>
      <AuthenticationGate>
        <AppScaffold />
      </AuthenticationGate>
    </MonetizationProvider>
  </AppLockProvider>
);

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
