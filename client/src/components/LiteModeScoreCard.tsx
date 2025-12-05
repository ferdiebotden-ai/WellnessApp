/**
 * LiteModeScoreCard
 *
 * Check-in score display for Lite Mode users (no wearable).
 * Shows a simplified 3-component breakdown with elegant visual hierarchy.
 *
 * Design: Maintains Apex OS aesthetic with zone colors, refined typography,
 * and a clear distinction from the wearable Recovery Score through
 * the "Check-in Score" label and reduced confidence indicator.
 *
 * @file client/src/components/LiteModeScoreCard.tsx
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import type { CheckInResult, CheckInComponents } from '../types/checkIn';

// =============================================================================
// TYPES
// =============================================================================

type RecoveryZone = 'red' | 'yellow' | 'green';

interface Props {
  /**
   * Check-in score data (null if no check-in today).
   */
  data: CheckInResult | null;

  /**
   * Loading state.
   */
  loading?: boolean;

  /**
   * Called when user wants to start a check-in.
   */
  onCheckIn?: () => void;

  /**
   * Called when card is pressed (for expansion).
   */
  onPress?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ZONE_COLORS: Record<RecoveryZone, string> = {
  green: palette.success,
  yellow: palette.accent,
  red: palette.error,
};

const ZONE_LABELS: Record<RecoveryZone, string> = {
  green: 'GOOD',
  yellow: 'MODERATE',
  red: 'LOW',
};

const ZONE_DESCRIPTIONS: Record<RecoveryZone, string> = {
  green: 'Ready for challenging activities',
  yellow: 'Consider lighter activity today',
  red: 'Prioritize rest and recovery',
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Zone indicator badge */
const ZoneBadge: React.FC<{ zone: RecoveryZone }> = ({ zone }) => {
  const zoneColor = ZONE_COLORS[zone];

  return (
    <View style={[styles.zoneBadge, { backgroundColor: `${zoneColor}15` }]}>
      <View style={[styles.zoneDot, { backgroundColor: zoneColor }]} />
      <Text style={[styles.zoneText, { color: zoneColor }]}>
        {ZONE_LABELS[zone]}
      </Text>
    </View>
  );
};

/** Lite Mode badge to distinguish from wearable scores */
const LiteModeBadge: React.FC = () => (
  <View style={styles.liteModeBadge}>
    <Text style={styles.liteModeBadgeText}>CHECK-IN</Text>
  </View>
);

/** Component breakdown row */
const ComponentRow: React.FC<{
  label: string;
  score: number;
  detail: string;
  emoji?: string;
}> = ({ label, score, detail, emoji }) => {
  const scoreColor =
    score >= 80 ? palette.success : score >= 50 ? palette.accent : palette.error;

  return (
    <View style={styles.componentRow}>
      <View style={styles.componentLabelContainer}>
        {emoji && <Text style={styles.componentEmoji}>{emoji}</Text>}
        <Text style={styles.componentLabel}>{label}</Text>
      </View>
      <View style={styles.componentScoreContainer}>
        <View style={styles.componentBar}>
          <View
            style={[
              styles.componentBarFill,
              { width: `${score}%`, backgroundColor: scoreColor },
            ]}
          />
        </View>
        <Text style={[styles.componentScore, { color: scoreColor }]}>
          {Math.round(score)}
        </Text>
      </View>
    </View>
  );
};

/** Empty state when no check-in exists */
const EmptyState: React.FC<{ onCheckIn?: () => void }> = ({ onCheckIn }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyTitle}>No check-in yet</Text>
    <Text style={styles.emptySubtext}>
      Complete your morning check-in for personalized guidance
    </Text>
    {onCheckIn && (
      <Pressable
        style={({ pressed }) => [
          styles.checkInButton,
          pressed && styles.checkInButtonPressed,
        ]}
        onPress={onCheckIn}
      >
        <Text style={styles.checkInButtonText}>Start Check-in</Text>
      </Pressable>
    )}
  </View>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const LiteModeScoreCard: React.FC<Props> = ({
  data,
  loading = false,
  onCheckIn,
  onPress,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const expandProgress = useSharedValue(0);

  const handlePress = useCallback(() => {
    if (!data) return;

    setExpanded((prev) => !prev);
    expandProgress.value = withSpring(expanded ? 0 : 1, {
      damping: 20,
      stiffness: 200,
    });

    onPress?.();
  }, [data, expanded, expandProgress, onPress]);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height);
  }, []);

  const expandableStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [0, contentHeight]),
    opacity: expandProgress.value,
  }));

  // Loading state
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Loading your score...</Text>
        </View>
      </View>
    );
  }

  // Empty state (no check-in today)
  if (!data) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Check-in Score</Text>
          <LiteModeBadge />
        </View>
        <EmptyState onCheckIn={onCheckIn} />
      </View>
    );
  }

  const { score, zone, confidence, components, reasoning, skipped } = data;
  const zoneColor = ZONE_COLORS[zone];

  // Map components to display format
  const componentRows = [
    {
      label: 'Sleep Quality',
      score: components.sleepQuality.score,
      detail: components.sleepQuality.label,
      emoji: '😴',
    },
    {
      label: 'Sleep Duration',
      score: components.sleepDuration.score,
      detail: components.sleepDuration.vsTarget,
      emoji: '⏰',
    },
    {
      label: 'Energy Level',
      score: components.energyLevel.score,
      detail: components.energyLevel.label,
      emoji: '⚡',
    },
  ];

  return (
    <Pressable onPress={handlePress}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Check-in Score</Text>
          <LiteModeBadge />
        </View>

        {/* Skipped warning */}
        {skipped && (
          <View style={styles.skippedBanner}>
            <Text style={styles.skippedText}>
              Using default values — complete tomorrow's check-in for accuracy
            </Text>
          </View>
        )}

        {/* Score Display */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreValue, { color: zoneColor }]}>
              {score}
            </Text>
            <View style={styles.scoreMeta}>
              <ZoneBadge zone={zone} />
              <Text style={styles.confidenceLabel}>
                {Math.round(confidence * 100)}% confidence
              </Text>
            </View>
          </View>

          {/* Zone description */}
          <Text style={styles.zoneDescription}>{ZONE_DESCRIPTIONS[zone]}</Text>
        </View>

        {/* Component Breakdown */}
        <View style={styles.componentsSection}>
          {componentRows.map((row) => (
            <ComponentRow
              key={row.label}
              label={row.label}
              score={row.score}
              detail={row.detail}
              emoji={row.emoji}
            />
          ))}
        </View>

        {/* Expandable Reasoning */}
        <Animated.View style={[styles.expandableContent, expandableStyle]}>
          <View onLayout={handleContentLayout} style={styles.reasoningContainer}>
            <Text style={styles.reasoningTitle}>Analysis</Text>
            <Text style={styles.reasoningText}>{reasoning}</Text>
          </View>
        </Animated.View>

        {/* Expand hint */}
        <View style={styles.expandHint}>
          <Text style={styles.expandHintText}>
            {expanded ? 'Tap to collapse' : 'Tap for more details'}
          </Text>
          <Text style={styles.expandHintArrow}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: palette.border,
    // Subtle depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  liteModeBadge: {
    backgroundColor: `${palette.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liteModeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.primary,
    letterSpacing: 1.2,
  },
  skippedBanner: {
    backgroundColor: `${palette.accent}15`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  skippedText: {
    fontSize: 12,
    color: palette.accent,
    textAlign: 'center',
    lineHeight: 16,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  },
  scoreMeta: {
    alignItems: 'flex-start',
    gap: 6,
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  confidenceLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '500',
  },
  zoneDescription: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  componentsSection: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 16,
    gap: 12,
  },
  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  componentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  componentEmoji: {
    fontSize: 16,
  },
  componentLabel: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  componentScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'flex-end',
  },
  componentBar: {
    width: 80,
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  componentBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  componentScore: {
    fontSize: 14,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
  expandableContent: {
    overflow: 'hidden',
  },
  reasoningContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: 16,
  },
  reasoningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 21,
  },
  expandHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  expandHintText: {
    fontSize: 12,
    color: palette.textMuted,
  },
  expandHintArrow: {
    fontSize: 10,
    color: palette.textMuted,
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: palette.textMuted,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  checkInButton: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  checkInButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  checkInButtonText: {
    color: palette.background,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default LiteModeScoreCard;
