/**
 * HomeHeader
 *
 * Personalized greeting header with date, chat button, and profile avatar.
 * Part of the Home Screen redesign (Session 57).
 *
 * @file client/src/components/home/HomeHeader.tsx
 */

import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';
import { haptic } from '../../utils/haptics';

interface Props {
  /** User's first name for greeting */
  userName?: string;
  /** Callback when profile avatar is pressed */
  onProfilePress?: () => void;
  /** Callback when chat button is pressed */
  onChatPress?: () => void;
}

/**
 * Get time-appropriate greeting
 */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Format current date as "Monday, December 9"
 */
const formatDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

export const HomeHeader: React.FC<Props> = ({
  userName,
  onProfilePress,
  onChatPress,
}) => {
  const greeting = useMemo(() => getGreeting(), []);
  const dateString = useMemo(() => formatDate(), []);

  // Haptic-enhanced press handlers
  const handleChatPress = useCallback(() => {
    void haptic.light();
    onChatPress?.();
  }, [onChatPress]);

  const handleProfilePress = useCallback(() => {
    void haptic.light();
    onProfilePress?.();
  }, [onProfilePress]);

  const greetingText = userName ? `${greeting}, ${userName}` : greeting;

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.greeting} testID="home-greeting">
          {greetingText}
        </Text>
        <Text style={styles.date} testID="home-date">
          {dateString}
        </Text>
      </View>

      <View style={styles.actions}>
        {/* Chat button */}
        <Pressable
          onPress={handleChatPress}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open AI chat"
          hitSlop={8}
          testID="home-chat-button"
        >
          <Text style={styles.iconText}>💬</Text>
        </Pressable>

        {/* Profile avatar */}
        <Pressable
          onPress={handleProfilePress}
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && styles.iconButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
          testID="home-profile-button"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: tokens.spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  greeting: {
    ...typography.h1,
    color: palette.textPrimary,
    fontSize: 24,
  },
  date: {
    ...typography.body,
    color: palette.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  iconButton: {
    width: tokens.touch.min,
    height: tokens.touch.min,
    borderRadius: tokens.touch.min / 2,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  iconText: {
    fontSize: 20,
  },
  avatarButton: {
    width: tokens.touch.min,
    height: tokens.touch.min,
    borderRadius: tokens.touch.min / 2,
  },
  avatar: {
    width: tokens.touch.min,
    height: tokens.touch.min,
    borderRadius: tokens.touch.min / 2,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.canvas,
  },
});

export default HomeHeader;
