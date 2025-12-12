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
import { tokens } from '../../theme/tokens';
import { getProtocolIcon, getProtocolEmoji } from '../../utils/protocolIcons';
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

  // Get protocol icon - derive slug from name
  const protocolSlug = name.toLowerCase().replace(/\s+/g, '_');
  const IconComponent = getProtocolIcon(protocolSlug);
  const emoji = getProtocolEmoji(protocolSlug);

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
          {/* Header row with icon */}
          <View style={styles.header}>
            {/* Protocol Icon */}
            <View style={[styles.iconContainer, isDueNow && styles.iconContainerDueNow]}>
              {IconComponent ? (
                <IconComponent size={28} color={isDueNow ? palette.primary : palette.textSecondary} />
              ) : (
                <Text style={styles.iconEmoji}>{emoji}</Text>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Time badge row */}
              <View style={styles.timeRow}>
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
            </View>

            {/* Chevron */}
            <Text style={styles.chevron}>›</Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
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
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  // Protocol icon container
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDueNow: {
    backgroundColor: `${palette.primary}15`,
  },
  iconEmoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
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
    ...typography.caption,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  timeTextDueNow: {
    color: palette.primary,
  },
  nowBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  nowBadgeText: {
    ...typography.caption,
    color: palette.canvas,
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
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  durationPill: {
    backgroundColor: `${palette.primary}15`,
    paddingHorizontal: tokens.spacing.sm,
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
  chevron: {
    fontSize: 24,
    color: palette.textMuted,
    fontWeight: '300',
  },
});
