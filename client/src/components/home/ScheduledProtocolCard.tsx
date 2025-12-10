import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import type { ScheduledProtocol } from '../../hooks/useEnrolledProtocols';

/**
 * Category colors matching ProtocolDetailScreen.
 */
const CATEGORY_COLORS: Record<string, string> = {
  foundation: palette.secondary, // Blue
  performance: palette.primary, // Teal
  recovery: palette.accent, // Gold
  optimization: palette.success, // Green
  meta: '#8B5CF6', // Purple
};

interface ScheduledProtocolCardProps {
  protocol: ScheduledProtocol;
  onPress: (protocol: ScheduledProtocol) => void;
  testID?: string;
}

/**
 * Card displaying an enrolled protocol with scheduled time,
 * status indicators (due now, upcoming), and tap-to-start.
 */
export const ScheduledProtocolCard: React.FC<ScheduledProtocolCardProps> = ({
  protocol,
  onPress,
  testID,
}) => {
  const { isDueNow, isUpcoming, minutesUntil, localTime } = protocol;
  const { name, category, duration_minutes } = protocol.protocol;

  // Pulsing animation for "due now" state
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (isDueNow) {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isDueNow, pulseOpacity]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: isDueNow
      ? `rgba(99, 230, 190, ${pulseOpacity.value})`
      : palette.border,
  }));

  const categoryColor = CATEGORY_COLORS[category?.toLowerCase()] || palette.primary;

  return (
    <Pressable
      onPress={() => onPress(protocol)}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${name} scheduled at ${localTime}`}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.card,
            isDueNow && styles.cardDueNow,
            animatedBorderStyle,
            pressed && styles.cardPressed,
          ]}
        >
          {/* Header row: Time badge + Status indicator */}
          <View style={styles.header}>
            <View style={[styles.timeBadge, isDueNow && styles.timeBadgeDueNow]}>
              <Text style={[styles.timeText, isDueNow && styles.timeTextDueNow]}>
                {localTime}
              </Text>
            </View>

            {/* Status indicator */}
            {isDueNow && (
              <View style={styles.nowBadge}>
                <Text style={styles.nowBadgeText}>NOW</Text>
              </View>
            )}
            {isUpcoming && minutesUntil && (
              <Text style={styles.upcomingText}>In {minutesUntil} min</Text>
            )}
          </View>

          {/* Protocol name */}
          <Text style={styles.protocolName} numberOfLines={2}>
            {name}
          </Text>

          {/* Meta row: Duration + Category indicator */}
          <View style={styles.metaRow}>
            {duration_minutes && (
              <View style={styles.durationPill}>
                <Text style={styles.durationText}>{duration_minutes} min</Text>
              </View>
            )}
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.categoryText}>
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Protocol'}
            </Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardDueNow: {
    borderWidth: 1.5,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: palette.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeDueNow: {
    backgroundColor: `${palette.primary}20`,
  },
  timeText: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  timeTextDueNow: {
    color: palette.primary,
  },
  nowBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  nowBadgeText: {
    ...typography.caption,
    color: palette.background,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  upcomingText: {
    ...typography.caption,
    color: palette.textMuted,
  },
  protocolName: {
    ...typography.subheading,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationPill: {
    backgroundColor: `${palette.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    ...typography.caption,
    color: palette.textMuted,
  },
});
