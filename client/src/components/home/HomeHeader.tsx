/**
 * HomeHeader
 *
 * Personalized greeting header with date display.
 * Part of the Home Screen redesign (Session 57).
 * Simplified in Session 81 - removed redundant chat/profile buttons.
 *
 * @file client/src/components/home/HomeHeader.tsx
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';

interface Props {
  /** User's first name for greeting */
  userName?: string;
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

export const HomeHeader: React.FC<Props> = ({ userName }) => {
  const greeting = useMemo(() => getGreeting(), []);
  const dateString = useMemo(() => formatDate(), []);

  const greetingText = userName ? `${greeting}, ${userName}` : greeting;

  return (
    <View style={styles.container}>
      <Text style={styles.greeting} testID="home-greeting">
        {greetingText}
      </Text>
      <Text style={styles.date} testID="home-date">
        {dateString}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: tokens.spacing.md,
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
});

export default HomeHeader;
