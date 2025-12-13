/**
 * ProtocolCelebration
 *
 * Animated celebration overlay for protocol/nudge completion.
 * Shows checkmark spring-in, teal glow pulse, and particle burst.
 *
 * @file client/src/components/animations/ProtocolCelebration.tsx
 * @author Claude Opus 4.5 (Session 68)
 * @created December 13, 2025
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';
import { haptic } from '../../utils/haptics';

// =============================================================================
// TYPES
// =============================================================================

interface Props {
  /** Whether the celebration is visible */
  visible: boolean;
  /** Callback when animation completes (auto-dismiss) */
  onComplete?: () => void;
  /** Size of the celebration overlay (default: 120) */
  size?: number;
  /** Duration before auto-dismiss in ms (default: 1200) */
  duration?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SIZE = 120;
const DEFAULT_DURATION = 1200;
const PARTICLE_COUNT = 5;

// Particle positions (radial spread)
const PARTICLE_ANGLES = [0, 72, 144, 216, 288]; // 360/5 = 72 degrees apart

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Animated particle dot */
const Particle: React.FC<{
  angle: number;
  progress: SharedValue<number>;
  size: number;
}> = ({ angle, progress, size }) => {
  const particleStyle = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const distance = progress.value * (size * 0.6);
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: 1 - progress.value * 0.5 },
      ],
      opacity: 1 - progress.value,
    };
  });

  return <Animated.View style={[styles.particle, particleStyle]} />;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ProtocolCelebration: React.FC<Props> = ({
  visible,
  onComplete,
  size = DEFAULT_SIZE,
  duration = DEFAULT_DURATION,
}) => {
  // Animation values
  const checkmarkScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  const particleProgress = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    haptic.success();
  }, []);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (visible) {
      // Reset values
      checkmarkScale.value = 0;
      glowOpacity.value = 0;
      glowScale.value = 0.8;
      particleProgress.value = 0;
      containerOpacity.value = 1;

      // 1. Trigger haptic immediately
      triggerHaptic();

      // 2. Checkmark spring-in (scale 0 → 1.2 → 1.0)
      checkmarkScale.value = withSpring(1, {
        damping: 10,
        stiffness: 200,
        overshootClamping: false,
      });

      // 3. Glow pulse (opacity 0 → 0.8 → 0, scale 0.8 → 1.2)
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) })
      );
      glowScale.value = withTiming(1.4, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });

      // 4. Particle burst (delayed start, 500ms duration)
      particleProgress.value = withDelay(
        100,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
      );

      // 5. Auto-dismiss after duration
      containerOpacity.value = withDelay(
        duration - 200,
        withTiming(0, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(handleComplete)();
          }
        })
      );
    }
  }, [
    visible,
    checkmarkScale,
    glowOpacity,
    glowScale,
    particleProgress,
    containerOpacity,
    duration,
    triggerHaptic,
    handleComplete,
  ]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        { width: size, height: size },
      ]}
    >
      {/* Glow circle */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />

      {/* Particles */}
      <View style={styles.particleContainer}>
        {PARTICLE_ANGLES.map((angle, index) => (
          <Particle
            key={index}
            angle={angle}
            progress={particleProgress}
            size={size}
          />
        ))}
      </View>

      {/* Checkmark */}
      <Animated.View
        style={[
          styles.checkmarkContainer,
          checkmarkStyle,
          {
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: (size * 0.5) / 2,
          },
        ]}
      >
        <Animated.Text
          style={[styles.checkmark, { fontSize: size * 0.28 }]}
        >
          ✓
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: palette.primary,
  },
  particleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  checkmarkContainer: {
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: palette.background,
    fontWeight: '800',
  },
});

export default ProtocolCelebration;
