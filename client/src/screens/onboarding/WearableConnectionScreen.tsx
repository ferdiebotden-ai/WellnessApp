import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WearableCard, SkipButton } from '../../components/WearableCard';
import { palette } from '../../theme/palette';
import { ApexLoadingIndicator } from '../../components/ui/ApexLoadingIndicator';
import {
  ONBOARDING_WEARABLES,
  GOAL_TO_MODULE_MAP,
  type WearableSource,
  type PrimaryGoal,
  type BiometricProfileData,
} from '../../types/onboarding';
import { completeOnboarding } from '../../services/api';
import { useUpdateOnboarding } from '../../providers/AuthProvider';
import analytics from '../../services/AnalyticsService';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type WearableConnectionScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'WearableConnection'
>;

const AUTO_ADVANCE_DELAY = 600; // ms after selection before completing

export const WearableConnectionScreen: React.FC<WearableConnectionScreenProps> = ({
  route,
}) => {
  const { selectedGoal, biometrics } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const [selectedWearable, setSelectedWearable] = useState<WearableSource | null>(null);
  const updateOnboarding = useUpdateOnboarding();
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter wearables based on current platform
  const platformWearables = useMemo(() => {
    const currentPlatform = Platform.OS as 'ios' | 'android' | 'web';
    return ONBOARDING_WEARABLES.filter((w) => w.platforms.includes(currentPlatform));
  }, []);

  const completeOnboardingFlow = useCallback(
    async (wearableSource: WearableSource | null) => {
      setSubmitting(true);

      try {
        const primaryModuleId = GOAL_TO_MODULE_MAP[selectedGoal as PrimaryGoal];

        await completeOnboarding({
          primary_goal: selectedGoal as PrimaryGoal,
          wearable_source: wearableSource,
          primary_module_id: primaryModuleId,
          biometrics: biometrics ?? null,
        });

        // Track analytics
        void analytics.trackOnboardingComplete({
          primaryModuleId,
          goal: selectedGoal,
          wearable: wearableSource ?? 'skipped',
          hasBiometrics: !!biometrics?.birthDate || !!biometrics?.biologicalSex,
        });

        // Mark onboarding complete - RootNavigator will show MainStack
        await updateOnboarding(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to complete setup';
        Alert.alert('Something went wrong', message, [
          { text: 'Try again', onPress: () => completeOnboardingFlow(wearableSource) },
          { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
        ]);
      }
    },
    [selectedGoal, biometrics, updateOnboarding]
  );

  const handleSelectWearable = useCallback(
    (wearableId: string) => {
      // Clear any existing timer
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }

      setSelectedWearable(wearableId as WearableSource);

      // Auto-advance after delay
      autoAdvanceTimer.current = setTimeout(() => {
        void completeOnboardingFlow(wearableId as WearableSource);
      }, AUTO_ADVANCE_DELAY);
    },
    [completeOnboardingFlow]
  );

  const handleSkip = useCallback(() => {
    void completeOnboardingFlow(null);
  }, [completeOnboardingFlow]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  if (submitting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ApexLoadingIndicator size={48} />
          <Text style={styles.loadingText}>Building your system...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.question}>Do you track with a wearable?</Text>
          <Text style={styles.subtitle}>
            Apex OS works with all major devices. You can add this later too.
          </Text>
        </Animated.View>

        <View style={styles.wearablesGrid}>
          {platformWearables.map((wearable, index) => (
            <Animated.View
              key={wearable.id}
              entering={FadeInDown.duration(400).delay(200 + index * 80)}
              style={styles.wearableItem}
            >
              <WearableCard
                wearable={wearable}
                onSelect={handleSelectWearable}
              />
              {selectedWearable === wearable.id && (
                <View style={styles.selectedOverlay}>
                  <Text style={styles.selectedCheck}>✓</Text>
                </View>
              )}
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.duration(500).delay(700)}>
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
  wearablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  wearableItem: {
    width: '48%',
    position: 'relative',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 230, 190, 0.15)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    fontSize: 32,
    color: palette.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: palette.textSecondary,
  },
});
