/**
 * SplashScreen - Authentication loading screen
 *
 * Displays the Apex OS vertical logo with branded loading indicator
 * while checking authentication state.
 *
 * @file client/src/screens/SplashScreen.tsx
 * @author Claude Opus 4.5 (Session 68)
 */

import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import { ApexLoadingIndicator } from '../components/ui/ApexLoadingIndicator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_WIDTH = SCREEN_WIDTH * 0.4; // 40% of screen per design spec

/**
 * Loading screen displayed while checking authentication state.
 */
export const SplashScreen: React.FC = () => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    // Fade in animation
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Vertical logo with brand name */}
        <Animated.View style={animatedStyle}>
          <Image
            source={require('../../assets/Logo/vertical - Logo-Brand Name.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Apex OS Logo"
          />
        </Animated.View>

        {/* Branded loading indicator */}
        <View style={styles.loaderContainer}>
          <ApexLoadingIndicator size={48} />
        </View>
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
    width: LOGO_WIDTH,
    height: LOGO_WIDTH * 1.2, // Maintain aspect ratio for vertical logo
  },
  loaderContainer: {
    marginTop: 48,
  },
});

export default SplashScreen;
