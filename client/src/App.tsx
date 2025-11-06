import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { Alert, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { BottomTabs } from './navigation/BottomTabs';
import { TopNavigationBar } from './components/TopNavigationBar';
import { palette } from './theme/palette';

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

export const App: React.FC = () => {
  const handleAiCoachPress = () => {
    Alert.alert('AI Coach', 'The AI Coach will be available soon.');
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
        <View style={styles.contentWrapper}>
          <BottomTabs />
        </View>
      </SafeAreaView>
    </NavigationContainer>
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
