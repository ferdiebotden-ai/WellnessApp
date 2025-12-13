import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
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
import {
  ONBOARDING_WEARABLES,
  type WearableSource,
  type PrimaryGoal,
} from '../../types/onboarding';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type WearableConnectionScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'WearableConnection'
>;

const AUTO_ADVANCE_DELAY = 600; // ms after selection before navigating to MagicMoment

export const WearableConnectionScreen: React.FC<WearableConnectionScreenProps> = ({
  route,
  navigation,
}) => {
  const { selectedGoal, biometrics } = route.params;
  const [selectedWearable, setSelectedWearable] = useState<WearableSource | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter wearables based on current platform
  const platformWearables = useMemo(() => {
    const currentPlatform = Platform.OS as 'ios' | 'android' | 'web';
    return ONBOARDING_WEARABLES.filter((w) => w.platforms.includes(currentPlatform));
  }, []);

  // Navigate to MagicMoment screen instead of completing onboarding here
  const navigateToMagicMoment = useCallback(
    (wearableSource: WearableSource | null) => {
      navigation.navigate('MagicMoment', {
        selectedGoal: selectedGoal as PrimaryGoal,
        biometrics: biometrics ?? undefined,
        wearableSource,
      });
    },
    [navigation, selectedGoal, biometrics]
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
        navigateToMagicMoment(wearableId as WearableSource);
      }, AUTO_ADVANCE_DELAY);
    },
    [navigateToMagicMoment]
  );

  const handleSkip = useCallback(() => {
    navigateToMagicMoment(null);
  }, [navigateToMagicMoment]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

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
});
