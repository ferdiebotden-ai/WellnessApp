import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette } from '../../theme/palette';
import {
  HEALTH_PLATFORMS,
  type HealthPlatform,
  type PrimaryGoal,
  type BiometricProfileData,
  type WearableSource,
} from '../../types/onboarding';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HealthDataSyncScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'HealthDataSync'
>;

interface HealthPlatformCardProps {
  platform: (typeof HEALTH_PLATFORMS)[number];
  onConnect: (platformId: HealthPlatform) => void;
}

const HealthPlatformCard: React.FC<HealthPlatformCardProps> = ({
  platform,
  onConnect,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Connect to ${platform.name}`}
      onPress={() => onConnect(platform.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.platformCard, animatedStyle]}
    >
      <View style={styles.platformHeader}>
        <Text style={styles.platformIcon}>{platform.icon}</Text>
        <View style={styles.platformInfo}>
          <Text style={styles.platformName}>{platform.name}</Text>
          <Text style={styles.platformDescription}>{platform.description}</Text>
        </View>
      </View>
      <View style={styles.connectButton}>
        <Text style={styles.connectButtonText}>Connect</Text>
      </View>
    </AnimatedPressable>
  );
};

interface SkipButtonProps {
  onPress: () => void;
}

const SkipButton: React.FC<SkipButtonProps> = ({ onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Skip health data sync for now"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.skipButton, animatedStyle]}
    >
      <Text style={styles.skipText}>Skip for now</Text>
      <Text style={styles.skipSubtext}>You can connect in Settings</Text>
    </AnimatedPressable>
  );
};

export const HealthDataSyncScreen: React.FC<HealthDataSyncScreenProps> = ({
  route,
  navigation,
}) => {
  const { selectedGoal, biometrics, wearableSource } = route.params;

  // Filter to show only the platform for the current OS
  const currentPlatform = useMemo(() => {
    const os = Platform.OS as 'ios' | 'android';
    return HEALTH_PLATFORMS.find((p) => p.platform === os) ?? null;
  }, []);

  const navigateToMagicMoment = useCallback(
    (healthPlatform: HealthPlatform | null) => {
      navigation.navigate('MagicMoment', {
        selectedGoal: selectedGoal as PrimaryGoal,
        biometrics: biometrics ?? undefined,
        wearableSource: wearableSource ?? null,
        healthPlatform,
      });
    },
    [navigation, selectedGoal, biometrics, wearableSource]
  );

  const handleConnect = useCallback(
    (platformId: HealthPlatform) => {
      // In a real app, this would trigger the health platform permission flow
      // For now, we just pass the selection forward
      navigateToMagicMoment(platformId);
    },
    [navigateToMagicMoment]
  );

  const handleSkip = useCallback(() => {
    navigateToMagicMoment(null);
  }, [navigateToMagicMoment]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.header}
        >
          <Text style={styles.question}>Sync your health data?</Text>
          <Text style={styles.subtitle}>
            Connect to access steps, sleep, heart rate, and more from your
            phone's health app.
          </Text>
        </Animated.View>

        {currentPlatform ? (
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <HealthPlatformCard
              platform={currentPlatform}
              onConnect={handleConnect}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={styles.unsupportedContainer}
          >
            <Text style={styles.unsupportedText}>
              Health data sync is not available on this platform.
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(500).delay(500)}>
          <SkipButton onPress={handleSkip} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  question: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 24,
  },
  platformCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 16,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  platformIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.surface,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.border,
    marginTop: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  skipSubtext: {
    fontSize: 13,
    color: palette.textMuted,
  },
  unsupportedContainer: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  unsupportedText: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
  },
});
