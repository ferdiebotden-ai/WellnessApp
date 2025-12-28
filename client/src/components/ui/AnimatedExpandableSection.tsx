/**
 * AnimatedExpandableSection
 *
 * Reusable expandable section with smooth spring animations.
 * Extracted from ProtocolDetailScreen for shared use.
 *
 * @file client/src/components/ui/AnimatedExpandableSection.tsx
 * @session 97 (MVP-006)
 */

import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';

export interface AnimatedExpandableSectionProps {
  /** Section title displayed in header */
  title: string;
  /** Icon to display - can be emoji string or Ionicon name */
  icon: string;
  /** Whether icon is an emoji or Ionicon name */
  iconType?: 'emoji' | 'ionicon';
  /** Content to render when expanded */
  children: React.ReactNode;
  /** Whether section starts expanded */
  defaultExpanded?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Animated expandable section with spring physics.
 * Uses height interpolation for smooth expand/collapse.
 */
export const AnimatedExpandableSection: React.FC<AnimatedExpandableSectionProps> = ({
  title,
  icon,
  iconType = 'emoji',
  children,
  defaultExpanded = false,
  testID,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  // Use shared value for contentHeight - this ensures Reanimated worklets
  // react to height changes (React state doesn't work reliably in worklets)
  const contentHeight = useSharedValue(0);
  const animatedHeight = useSharedValue(defaultExpanded ? 1 : 0);

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      // Always update height when valid (allows re-measurement for dynamic content)
      if (height > 0) {
        contentHeight.value = height;
      }
    },
    [contentHeight]
  );

  const toggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    animatedHeight.value = withSpring(newExpanded ? 1 : 0, {
      damping: 20,
      stiffness: 200,
      overshootClamping: true,
    });
  }, [isExpanded, animatedHeight]);

  const expandStyle = useAnimatedStyle(() => {
    if (contentHeight.value === 0) {
      return { height: 0, opacity: 0, overflow: 'hidden' as const };
    }

    return {
      height: interpolate(animatedHeight.value, [0, 1], [0, contentHeight.value]),
      opacity: interpolate(animatedHeight.value, [0, 0.5, 1], [0, 0.5, 1]),
      overflow: 'hidden' as const,
    };
  });

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        onPress={toggleExpand}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} ${title}`}
      >
        <View style={styles.headerLeft}>
          {iconType === 'ionicon' ? (
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={palette.textSecondary}
            />
          ) : (
            <Text style={styles.iconEmoji}>{icon}</Text>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
      </Pressable>

      {/* Hidden measurement container - always fully laid out for accurate height */}
      <View style={styles.measureContainer} pointerEvents="none">
        <View onLayout={handleContentLayout} style={styles.content}>
          {children}
        </View>
      </View>

      {/* Animated visible content */}
      <Animated.View style={expandStyle}>
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
  },
  measureContainer: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerPressed: {
    backgroundColor: palette.elevated,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconEmoji: {
    fontSize: 18,
  },
  title: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  chevron: {
    fontSize: 10,
    color: palette.textMuted,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
});

export default AnimatedExpandableSection;
