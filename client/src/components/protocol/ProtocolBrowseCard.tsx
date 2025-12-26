/**
 * ProtocolBrowseCard
 *
 * Enhanced protocol card for browsing with inline expandable "Why" section.
 * Shows protocol info with collapsible mechanism explanation.
 *
 * Session 86: Protocol UI/UX Redesign
 */

import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';
import type { ModuleProtocol } from '../../services/api';

interface Props {
  protocol: ModuleProtocol;
  isEnrolled: boolean;
  isUpdating: boolean;
  onToggle: (protocolId: string, enroll: boolean) => void;
  onPress: () => void;
}

/**
 * Category icon mapping
 */
const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'Foundation':
      return 'sunny-outline';
    case 'Performance':
      return 'flash-outline';
    case 'Recovery':
      return 'moon-outline';
    case 'Optimization':
      return 'trending-up-outline';
    case 'Meta':
      return 'bulb-outline';
    default:
      return 'ellipse-outline';
  }
};

/**
 * Category colors
 */
const CATEGORY_COLORS: Record<string, string> = {
  foundation: palette.secondary,
  performance: palette.primary,
  recovery: palette.accent,
  optimization: palette.success,
  meta: '#8B5CF6',
};

/**
 * Format time string to display format
 */
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes?.toString().padStart(2, '0') ?? '00'} ${ampm}`;
};

export const ProtocolBrowseCard: React.FC<Props> = ({
  protocol,
  isEnrolled,
  isUpdating,
  onToggle,
  onPress,
}) => {
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);
  const expandAnimation = useSharedValue(0);

  const categoryColor = CATEGORY_COLORS[protocol.category?.toLowerCase()] || palette.primary;

  const toggleWhy = useCallback(() => {
    const newExpanded = !isWhyExpanded;
    setIsWhyExpanded(newExpanded);
    expandAnimation.value = withSpring(newExpanded ? 1 : 0, {
      damping: 20,
      stiffness: 200,
    });
  }, [isWhyExpanded, expandAnimation]);

  const expandStyle = useAnimatedStyle(() => ({
    height: interpolate(expandAnimation.value, [0, 1], [0, 80]),
    opacity: expandAnimation.value,
    overflow: 'hidden' as const,
  }));

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isEnrolled && styles.cardEnrolled,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${protocol.name}${isEnrolled ? ', enrolled' : ''}`}
      accessibilityHint="Tap to view details"
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}15` }]}>
          <Ionicons
            name={getCategoryIcon(protocol.category)}
            size={20}
            color={categoryColor}
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.name, isEnrolled && styles.nameEnrolled]} numberOfLines={1}>
            {protocol.short_name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{formatTime(protocol.default_time)}</Text>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.categoryText}>{protocol.category}</Text>
            {protocol.duration_minutes && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{protocol.duration_minutes}m</Text>
              </View>
            )}
          </View>
        </View>

        {/* Enrollment Toggle */}
        <View style={styles.enrollSection}>
          {isUpdating ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <Switch
              value={isEnrolled}
              onValueChange={(value) => onToggle(protocol.id, value)}
              trackColor={{ false: palette.surface, true: `${palette.primary}40` }}
              thumbColor={isEnrolled ? palette.primary : palette.textMuted}
              ios_backgroundColor={palette.surface}
            />
          )}
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.summary} numberOfLines={2}>
        {protocol.summary}
      </Text>

      {/* Why This Works - Expandable */}
      <Pressable
        style={({ pressed }) => [
          styles.whyPill,
          isWhyExpanded && styles.whyPillExpanded,
          pressed && styles.whyPillPressed,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          toggleWhy();
        }}
        hitSlop={8}
      >
        <Ionicons
          name="bulb-outline"
          size={14}
          color={palette.primary}
        />
        <Text style={styles.whyPillText}>
          {isWhyExpanded ? 'Hide' : 'Why this works'}
        </Text>
        <Ionicons
          name={isWhyExpanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={palette.textMuted}
        />
      </Pressable>

      {/* Expanded Why Content */}
      <Animated.View style={[styles.whyContent, expandStyle]}>
        <View style={styles.whyDivider} />
        <Text style={styles.whyText} numberOfLines={3}>
          {protocol.summary || 'Evidence-based protocol designed to optimize your wellness.'}
        </Text>
        <Text style={styles.citationHint}>
          Tap card for research citations
        </Text>
      </Animated.View>

      {/* Starter Badge */}
      {protocol.is_starter_protocol && (
        <View style={styles.starterBadge}>
          <Ionicons name="star" size={10} color={palette.primary} />
          <Text style={styles.starterBadgeText}>RECOMMENDED</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardEnrolled: {
    borderColor: palette.primary,
    backgroundColor: `${palette.primary}08`,
  },
  cardPressed: {
    backgroundColor: palette.elevated,
    transform: [{ scale: 0.98 }],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    color: palette.textPrimary,
    marginBottom: 4,
  },
  nameEnrolled: {
    color: palette.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: '500',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    ...typography.caption,
    color: palette.textMuted,
  },
  durationBadge: {
    backgroundColor: `${palette.primary}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
    fontSize: 11,
  },

  // Enrollment
  enrollSection: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary
  summary: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },

  // Why Pill
  whyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${palette.primary}10`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  whyPillExpanded: {
    backgroundColor: `${palette.primary}20`,
  },
  whyPillPressed: {
    backgroundColor: `${palette.primary}25`,
  },
  whyPillText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
  },

  // Why Content (expanded)
  whyContent: {
    marginTop: 8,
  },
  whyDivider: {
    height: 1,
    backgroundColor: palette.border,
    marginBottom: 10,
  },
  whyText: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  citationHint: {
    ...typography.caption,
    color: palette.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
    fontSize: 11,
  },

  // Starter Badge
  starterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${palette.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  starterBadgeText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
