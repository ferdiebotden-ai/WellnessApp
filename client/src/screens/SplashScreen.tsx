import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

/**
 * Loading screen displayed while checking authentication state.
 */
export const SplashScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Wellness OS</Text>
        <Text style={styles.tagline}>Your personalized health journey</Text>
        <ActivityIndicator
          color={palette.primary}
          size="large"
          style={styles.loader}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    ...typography.heading,
    fontSize: 32,
    color: palette.primary,
    marginBottom: 8,
  },
  tagline: {
    ...typography.body,
    color: palette.textSecondary,
    marginBottom: 48,
  },
  loader: {
    marginTop: 24,
  },
});

