import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/PrimaryButton';
import { palette } from '../../theme/palette';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type AICoachIntroScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'AICoachIntro'
>;

const ANIMATION_CONFIG = {
  duration: 800,
  easing: Easing.out(Easing.cubic),
};

const STAGGER_DELAY = 1200; // Delay between each line

export const AICoachIntroScreen: React.FC<AICoachIntroScreenProps> = ({ navigation }) => {
  const [showButton, setShowButton] = useState(false);

  // Animated values for each text line
  const line1Opacity = useSharedValue(0);
  const line2Opacity = useSharedValue(0);
  const line3Opacity = useSharedValue(0);

  const line1Y = useSharedValue(20);
  const line2Y = useSharedValue(20);
  const line3Y = useSharedValue(20);

  useEffect(() => {
    // Line 1: "Apex OS"
    line1Opacity.value = withTiming(1, ANIMATION_CONFIG);
    line1Y.value = withTiming(0, ANIMATION_CONFIG);

    // Line 2: "Your AI wellness operating system."
    line2Opacity.value = withDelay(
      STAGGER_DELAY,
      withTiming(1, ANIMATION_CONFIG)
    );
    line2Y.value = withDelay(STAGGER_DELAY, withTiming(0, ANIMATION_CONFIG));

    // Line 3: "Evidence-based. Personalized. Ambient."
    line3Opacity.value = withDelay(
      STAGGER_DELAY * 2,
      withTiming(1, ANIMATION_CONFIG)
    );
    line3Y.value = withDelay(STAGGER_DELAY * 2, withTiming(0, ANIMATION_CONFIG));

    // Show button after all text is visible
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, STAGGER_DELAY * 3);

    return () => clearTimeout(buttonTimer);
  }, [line1Opacity, line1Y, line2Opacity, line2Y, line3Opacity, line3Y]);

  const line1Style = useAnimatedStyle(() => ({
    opacity: line1Opacity.value,
    transform: [{ translateY: line1Y.value }],
  }));

  const line2Style = useAnimatedStyle(() => ({
    opacity: line2Opacity.value,
    transform: [{ translateY: line2Y.value }],
  }));

  const line3Style = useAnimatedStyle(() => ({
    opacity: line3Opacity.value,
    transform: [{ translateY: line3Y.value }],
  }));

  const handleContinue = () => {
    navigation.navigate('GoalSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient glow effect */}
      <View style={styles.glowContainer}>
        <View style={styles.glow} />
      </View>

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.headline, line1Style]}>
            Apex OS
          </Animated.Text>

          <Animated.Text style={[styles.subheadline, line2Style]}>
            Your AI wellness operating system.
          </Animated.Text>

          <Animated.Text style={[styles.tagline, line3Style]}>
            Evidence-based. Personalized. Ambient.
          </Animated.Text>
        </View>
      </View>

      <View style={styles.footer}>
        {showButton && (
          <Animated.View entering={FadeIn.duration(500)}>
            <PrimaryButton
              title="Continue"
              onPress={handleContinue}
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: palette.primary,
    opacity: 0.05,
    position: 'absolute',
    top: '30%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  textContainer: {
    alignItems: 'center',
  },
  headline: {
    fontSize: 48,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 16,
  },
  subheadline: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primary,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    minHeight: 80,
  },
});
