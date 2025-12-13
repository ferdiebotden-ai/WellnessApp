/**
 * MagicMomentScreen
 *
 * The "magic moment" confirmation screen shown after onboarding completion.
 * Displays: Recovery score preview + first enrolled protocol with science snippet.
 *
 * PRD Section 3.2: "User sees personalized recovery score + first protocol
 * within 30 seconds of completing onboarding."
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/ui/Card';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ApexLoadingIndicator } from '../../components/ui/ApexLoadingIndicator';
import { palette, getRecoveryColor } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import type {
  PrimaryGoal,
  BiometricProfileData,
  WearableSource,
} from '../../types/onboarding';
import { GOAL_TO_MODULE_MAP } from '../../types/onboarding';
import { completeOnboarding } from '../../services/api';
import { useUpdateOnboarding } from '../../providers/AuthProvider';
import analytics from '../../services/AnalyticsService';
import { haptic } from '../../utils/haptics';

type MagicMomentScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'MagicMoment'
>;

// Goal-to-starter-protocol mapping with evidence-based science snippets
const GOAL_TO_STARTER_PROTOCOL: Record<
  PrimaryGoal,
  {
    protocolName: string;
    scienceSnippet: string;
    citation: string;
    durationMinutes: number;
    icon: string;
  }
> = {
  better_sleep: {
    protocolName: 'Morning Light Exposure',
    scienceSnippet:
      'Bright light within 60 minutes of waking advances circadian phase by 0.5-2.7 hours, improving sleep efficiency by 10-15%.',
    citation: 'Khalsa et al., 2003',
    durationMinutes: 10,
    icon: '☀️',
  },
  more_energy: {
    protocolName: 'Hydration Protocol',
    scienceSnippet:
      'Even 1-2% dehydration impairs mood, concentration, and executive function. Morning hydration optimizes cortisol awakening response.',
    citation: 'Riebl & Davy, 2013',
    durationMinutes: 5,
    icon: '💧',
  },
  sharper_focus: {
    protocolName: 'Caffeine Timing',
    scienceSnippet:
      'Delaying caffeine 90-120 minutes after waking allows adenosine clearance, preventing afternoon crashes and improving sustained attention.',
    citation: 'Nehlig, 2010',
    durationMinutes: 0,
    icon: '☕',
  },
  faster_recovery: {
    protocolName: 'Sleep Hygiene Foundations',
    scienceSnippet:
      'Bedroom temperature 60-67°F and consistent bedtime (±30 min) improve sleep efficiency and next-day HRV recovery.',
    citation: 'Okamoto-Mizuno & Mizuno, 2012',
    durationMinutes: 15,
    icon: '🛏️',
  },
};

/**
 * Estimate recovery score based on biometrics and time of day.
 * Provides a realistic estimate for new users (65-85 range).
 */
function estimateRecoveryScore(
  biometrics: BiometricProfileData | undefined,
  hasWearable: boolean
): number {
  // Base score for new users: moderate range
  let baseScore = 70;

  // Adjust based on age if available
  if (biometrics?.birthDate) {
    const birthYear = new Date(biometrics.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age < 30) baseScore += 3;
    else if (age > 50) baseScore -= 3;
  }

  // Users with wearables get slightly higher estimate (engagement signal)
  if (hasWearable) baseScore += 2;

  // Time of day adjustment
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 10) baseScore += 2; // Morning boost
  else if (hour >= 22 || hour <= 5) baseScore -= 5; // Late night penalty

  // Clamp to valid range
  return Math.min(Math.max(baseScore, 40), 85);
}

export const MagicMomentScreen: React.FC<MagicMomentScreenProps> = ({
  route,
}) => {
  const { selectedGoal, biometrics, wearableSource } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const updateOnboarding = useUpdateOnboarding();

  // Calculate estimated recovery score
  const estimatedScore = estimateRecoveryScore(biometrics, !!wearableSource);
  const recoveryColor = getRecoveryColor(estimatedScore);

  // Get starter protocol for this goal
  const starterProtocol = GOAL_TO_STARTER_PROTOCOL[selectedGoal];

  const handleStart = useCallback(async () => {
    setSubmitting(true);
    void haptic.medium();

    try {
      const primaryModuleId = GOAL_TO_MODULE_MAP[selectedGoal];

      await completeOnboarding({
        primary_goal: selectedGoal,
        wearable_source: wearableSource ?? null,
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
      const message =
        err instanceof Error ? err.message : 'Failed to complete setup';
      Alert.alert('Something went wrong', message, [
        { text: 'Try again', onPress: () => void handleStart() },
        { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
      ]);
    }
  }, [selectedGoal, biometrics, wearableSource, updateOnboarding]);

  if (submitting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ApexLoadingIndicator size={48} />
          <Text style={styles.loadingText}>Initializing your system...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient glow effect */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, { backgroundColor: recoveryColor }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.header}
        >
          <Text style={styles.readyText}>Your system is ready</Text>
        </Animated.View>

        {/* Recovery Score Card */}
        <Animated.View entering={FadeIn.duration(800).delay(300)}>
          <Card variant="hero" style={styles.recoveryCard}>
            <Text style={styles.cardLabel}>ESTIMATED RECOVERY</Text>
            <View style={styles.scoreContainer}>
              <AnimatedNumber
                value={estimatedScore}
                suffix="%"
                color={recoveryColor}
                duration={1200}
              />
            </View>
            <Text style={styles.scoreNote}>
              {wearableSource
                ? 'Your personalized score will update once we sync your data.'
                : 'Connect a wearable anytime to unlock real-time tracking.'}
            </Text>
          </Card>
        </Animated.View>

        {/* First Protocol Card */}
        <Animated.View entering={FadeInUp.duration(600).delay(800)}>
          <Card variant="highlighted" style={styles.protocolCard}>
            <View style={styles.protocolHeader}>
              <Text style={styles.protocolIcon}>{starterProtocol.icon}</Text>
              <View style={styles.protocolInfo}>
                <Text style={styles.protocolLabel}>YOUR FIRST PROTOCOL</Text>
                <Text style={styles.protocolName}>
                  {starterProtocol.protocolName}
                </Text>
              </View>
              {starterProtocol.durationMinutes > 0 && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>
                    {starterProtocol.durationMinutes}m
                  </Text>
                </View>
              )}
            </View>

            {/* Science Snippet */}
            <View style={styles.scienceContainer}>
              <Text style={styles.scienceSnippet}>
                {starterProtocol.scienceSnippet}
              </Text>
              <Text style={styles.citation}>
                — {starterProtocol.citation}
              </Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* CTA Button */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(1200)}
        style={styles.footer}
      >
        <PrimaryButton
          title="Start Your First Day"
          onPress={handleStart}
          testID="magic-moment-start-button"
        />
      </Animated.View>
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
    overflow: 'hidden',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
    position: 'absolute',
    top: '20%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 120,
  },
  header: {
    marginBottom: tokens.spacing.lg,
  },
  readyText: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  recoveryCard: {
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  cardLabel: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.5,
    marginBottom: tokens.spacing.sm,
  },
  scoreContainer: {
    marginVertical: tokens.spacing.sm,
  },
  scoreNote: {
    ...typography.caption,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
  },
  protocolCard: {
    marginTop: tokens.spacing.sm,
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  protocolIcon: {
    fontSize: 32,
    marginRight: tokens.spacing.sm,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolLabel: {
    ...typography.caption,
    color: palette.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  protocolName: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  durationBadge: {
    backgroundColor: palette.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.sm,
  },
  durationText: {
    ...typography.caption,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  scienceContainer: {
    backgroundColor: palette.elevated,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
  },
  scienceSnippet: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  citation: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: tokens.spacing.sm,
    fontStyle: 'italic',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: palette.background,
  },
});

export default MagicMomentScreen;
