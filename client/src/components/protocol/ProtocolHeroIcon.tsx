import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';
import { tokens } from '../../theme/tokens';
import { elevation, createGlow } from '../../theme/elevation';
import { getProtocolIcon, getProtocolEmoji } from '../../utils/protocolIcons';

interface ProtocolHeroIconProps {
  /** Protocol identifier (e.g., 'morning_light', 'cold-plunge') */
  protocolId: string;
  /** Icon size in pixels (default: 120) */
  size?: number;
  /** Icon color (default: palette.primary) */
  color?: string;
  /** Delay before animation starts (ms) */
  animationDelay?: number;
  /** Additional container style */
  style?: ViewStyle;
}

/**
 * Protocol Hero Icon Component
 *
 * Large display icon for protocol detail screens.
 * Features:
 * - 120x120pt default size
 * - Scale animation on load (0.95→1, 200ms)
 * - Teal glow effect
 * - Fallback to emoji with glow if no custom icon
 */
export function ProtocolHeroIcon({
  protocolId,
  size = 120,
  color = palette.primary,
  animationDelay = 0,
  style,
}: ProtocolHeroIconProps): JSX.Element {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animate in with spring
    scale.value = withDelay(
      animationDelay,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
    );
    opacity.value = withDelay(
      animationDelay,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
    );
  }, [animationDelay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const IconComponent = getProtocolIcon(protocolId);
  const emoji = getProtocolEmoji(protocolId);

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          createGlow(color, 0.25),
        ]}
      >
        {IconComponent ? (
          <IconComponent size={size * 0.6} color={color} />
        ) : (
          <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{emoji}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: {
    textAlign: 'center',
  },
});

export default ProtocolHeroIcon;
