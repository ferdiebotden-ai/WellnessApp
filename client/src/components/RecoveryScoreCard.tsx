/**
 * RecoveryScoreCard
 *
 * Premium recovery score display with expandable "Why?" panel.
 * Shows zone-colored score, trend indicator, and component breakdown.
 *
 * Design: Bloomberg Terminal meets Oura Ring - data-dense, refined, professional.
 *
 * @file client/src/components/RecoveryScoreCard.tsx
 * @author Claude Opus 4.5 (Session 40)
 * @created December 4, 2025
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import type { EdgeCases } from '../types/edgeCases';
import { EdgeCaseBadgeRow } from './EdgeCaseBadgeRow';

// =============================================================================
// TYPES
// =============================================================================

export type RecoveryZone = 'red' | 'yellow' | 'green';
export type BaselineConfidence = 'low' | 'medium' | 'high';

export interface RecoveryComponent {
  label: string;
  score: number;
  detail: string;
  weight: number;
}

export interface RecoveryScoreData {
  score: number;
  zone: RecoveryZone;
  confidence: number;
  trend: 'up' | 'down' | 'steady' | null;
  trendDelta?: number;
  components: RecoveryComponent[];
  reasoning?: string;
  /** Edge case detection results (Session 46) */
  edgeCases?: EdgeCases;
}

export interface BaselineStatus {
  ready: boolean;
  daysCollected: number;
  daysRequired: number;
  message: string;
}

interface Props {
  data: RecoveryScoreData | null;
  baselineStatus: BaselineStatus;
  loading?: boolean;
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
  green: 'OPTIMAL',
  yellow: 'MODERATE',
  red: 'RECOVER',
};

const ZONE_DESCRIPTIONS: Record<RecoveryZone, string> = {
  green: 'Ready for high-intensity training',
  yellow: 'Moderate activity recommended',
  red: 'Prioritize rest and recovery',
};

// =============================================================================
// ANIMATED SCORE (Count-up animation)
// =============================================================================

interface AnimatedScoreProps {
  score: number;
  color: string;
}

/**
 * Animated score display with count-up effect
 * Respects reduced motion preferences
 */
const AnimatedScore: React.FC<AnimatedScoreProps> = ({ score, color }) => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const animatedScore = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      listener.remove();
    };
  }, []);

  // Animate score on mount or score change
  useEffect(() => {
    if (reduceMotion) {
      setDisplayScore(score);
      return;
    }

    animatedScore.value = 0;
    animatedScore.value = withTiming(score, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [score, reduceMotion, animatedScore]);

  // Update display score as animation progresses
  useDerivedValue(() => {
    runOnJS(setDisplayScore)(Math.round(animatedScore.value));
  });

  return (
    <Text style={[styles.scoreHero, { color }]}>
      {displayScore}
    </Text>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Zone indicator badge */
const ZoneBadge: React.FC<{ zone: RecoveryZone }> = ({ zone }) => {
  const zoneColor = ZONE_COLORS[zone];

  return (
    <View style={[styles.zoneBadge, { backgroundColor: `${zoneColor}20` }]}>
      <View style={[styles.zoneDot, { backgroundColor: zoneColor }]} />
      <Text style={[styles.zoneText, { color: zoneColor }]}>
        {ZONE_LABELS[zone]}
      </Text>
    </View>
  );
};

/** Trend indicator with delta */
const TrendIndicator: React.FC<{
  trend: 'up' | 'down' | 'steady' | null;
  delta?: number;
}> = ({ trend, delta }) => {
  if (!trend) return null;

  const trendConfig = {
    up: { symbol: '▲', color: palette.success, label: 'Improving' },
    down: { symbol: '▼', color: palette.error, label: 'Declining' },
    steady: { symbol: '●', color: palette.textMuted, label: 'Stable' },
  };

  const config = trendConfig[trend];
  const deltaText = delta ? ` (${delta > 0 ? '+' : ''}${delta})` : '';

  return (
    <View style={styles.trendContainer}>
      <Text style={[styles.trendSymbol, { color: config.color }]}>
        {config.symbol}
      </Text>
      <Text style={[styles.trendLabel, { color: config.color }]}>
        {config.label}
        {deltaText}
      </Text>
    </View>
  );
};

/** Confidence indicator dots */
const ConfidenceIndicator: React.FC<{ level: number }> = ({ level }) => {
  // Map 0-1 confidence to low/medium/high
  const confidenceLevel: BaselineConfidence =
    level >= 0.8 ? 'high' : level >= 0.5 ? 'medium' : 'low';

  const dotCount = confidenceLevel === 'high' ? 3 : confidenceLevel === 'medium' ? 2 : 1;

  return (
    <View style={styles.confidenceContainer}>
      <Text style={styles.confidenceLabel}>CONFIDENCE</Text>
      <View style={styles.confidenceDots}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.confidenceDot,
              i <= dotCount && styles.confidenceDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

/** Component breakdown row */
const ComponentRow: React.FC<{ component: RecoveryComponent }> = ({ component }) => {
  const progressWidth = `${Math.min(100, component.score)}%`;

  return (
    <View style={styles.componentRow}>
      <View style={styles.componentHeader}>
        <Text style={styles.componentLabel}>{component.label}</Text>
        <Text style={styles.componentScore}>{component.score}</Text>
      </View>
      <View style={styles.componentBarBackground}>
        <View
          style={[
            styles.componentBarFill,
            { width: progressWidth as any },
            component.score >= 67 && { backgroundColor: palette.success },
            component.score >= 34 && component.score < 67 && { backgroundColor: palette.accent },
            component.score < 34 && { backgroundColor: palette.error },
          ]}
        />
      </View>
      <Text style={styles.componentDetail}>{component.detail}</Text>
    </View>
  );
};

/** Building baseline state */
const BuildingBaseline: React.FC<{ status: BaselineStatus }> = ({ status }) => {
  const progress = status.daysCollected / status.daysRequired;
  const progressWidth = `${Math.round(progress * 100)}%`;

  return (
    <View style={styles.baselineContainer}>
      <View style={styles.baselineHeader}>
        <Text style={styles.baselineTitle}>BUILDING YOUR BASELINE</Text>
        <Text style={styles.baselineDays}>
          Day {status.daysCollected}/{status.daysRequired}
        </Text>
      </View>

      <View style={styles.baselineProgressBackground}>
        <View style={[styles.baselineProgressFill, { width: progressWidth as any }]} />
      </View>

      <Text style={styles.baselineMessage}>
        We need {status.daysRequired - status.daysCollected} more days of data to calculate your personalized recovery score.
      </Text>

      <View style={styles.baselineHint}>
        <Text style={styles.baselineHintIcon}>💡</Text>
        <Text style={styles.baselineHintText}>
          Sync your wearable daily for accurate baselines
        </Text>
      </View>
    </View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const RecoveryScoreCard: React.FC<Props> = ({
  data,
  baselineStatus,
  loading = false,
  onPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useSharedValue(0);

  // Handle content layout measurement
  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && contentHeight === 0) {
      setContentHeight(height);
    }
  }, [contentHeight]);

  // Toggle expansion with spring animation
  const toggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    animatedHeight.value = withSpring(newExpanded ? 1 : 0, {
      damping: 20,
      stiffness: 200,
      overshootClamping: true,
    });
  }, [isExpanded, animatedHeight]);

  // Animated style for expansion
  const expandStyle = useAnimatedStyle(() => {
    if (contentHeight === 0) {
      return { height: 0, opacity: 0, overflow: 'hidden' as const };
    }

    return {
      height: interpolate(animatedHeight.value, [0, 1], [0, contentHeight]),
      opacity: interpolate(animatedHeight.value, [0, 0.5, 1], [0, 0.5, 1]),
      overflow: 'hidden' as const,
    };
  });

  // Progress bar width for score
  const progressWidth = useMemo(() => {
    if (!data) return '0%';
    return `${Math.min(100, data.score)}%`;
  }, [data]);

  // Zone color
  const zoneColor = useMemo(() => {
    if (!data) return palette.primary;
    return ZONE_COLORS[data.zone];
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recovery data...</Text>
        </View>
      </View>
    );
  }

  // If baseline not ready, show building state
  if (!baselineStatus.ready || !data) {
    return (
      <View style={styles.container}>
        <BuildingBaseline status={baselineStatus} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header: Label + Score */}
      <Pressable onPress={onPress} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.label}>RECOVERY</Text>
          <ZoneBadge zone={data.zone} />
          {/* Edge case badges (Session 46) */}
          {data.edgeCases && (
            <EdgeCaseBadgeRow
              edgeCases={data.edgeCases}
              size="default"
              maxBadges={3}
              testID="recovery-edge-case-badges"
            />
          )}
        </View>
        <View style={styles.headerRight}>
          <AnimatedScore score={data.score} color={zoneColor} />
          <Text style={styles.scoreMax}>/100</Text>
        </View>
      </Pressable>

      {/* Progress bar */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: progressWidth as any, backgroundColor: zoneColor },
          ]}
        />
      </View>

      {/* Status row: Zone description + Trend + Confidence */}
      <View style={styles.statusRow}>
        <Text style={styles.zoneDescription}>{ZONE_DESCRIPTIONS[data.zone]}</Text>
        <View style={styles.statusRight}>
          <TrendIndicator trend={data.trend} delta={data.trendDelta} />
          <ConfidenceIndicator level={data.confidence} />
        </View>
      </View>

      {/* Why? button */}
      {data.components.length > 0 && (
        <Pressable
          onPress={toggleExpand}
          style={styles.whyButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Hide details' : 'Show why'}
        >
          <Text style={styles.whyButtonText}>
            {isExpanded ? 'Hide Details' : 'Why?'}
          </Text>
          <Text style={styles.whyButtonIcon}>
            {isExpanded ? '▲' : '▼'}
          </Text>
        </Pressable>
      )}

      {/* Expandable component breakdown */}
      <Animated.View style={expandStyle}>
        <View onLayout={handleContentLayout} style={styles.expansionContent}>
          <View style={styles.divider} />

          {/* Component breakdown */}
          <Text style={styles.sectionTitle}>COMPONENT BREAKDOWN</Text>
          {data.components.map((component, index) => (
            <ComponentRow key={index} component={component} />
          ))}

          {/* Reasoning */}
          {data.reasoning && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>SUMMARY</Text>
              <Text style={styles.reasoning}>{data.reasoning}</Text>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    // Hero elevation shadow (Session 57)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: palette.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  label: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  score: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  // Hero sizing for Session 57 redesign (56px, monospace-style)
  scoreHero: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  scoreMax: {
    ...typography.subheading,
    color: palette.textMuted,
    marginLeft: 4,
  },

  // Zone badge
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Progress bar (6px height for Session 57 redesign)
  progressBarBackground: {
    height: 6,
    backgroundColor: palette.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneDescription: {
    ...typography.body,
    color: palette.textSecondary,
    flex: 1,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  // Trend
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendSymbol: {
    fontSize: 10,
  },
  trendLabel: {
    ...typography.caption,
    fontWeight: '500',
  },

  // Confidence
  confidenceContainer: {
    alignItems: 'center',
    gap: 4,
  },
  confidenceLabel: {
    ...typography.caption,
    color: palette.textMuted,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  confidenceDots: {
    flexDirection: 'row',
    gap: 3,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.elevated,
  },
  confidenceDotActive: {
    backgroundColor: palette.primary,
  },

  // Why button
  whyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 6,
  },
  whyButtonText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
  },
  whyButtonIcon: {
    fontSize: 10,
    color: palette.primary,
  },

  // Expansion
  expansionContent: {
    paddingTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 16,
  },
  sectionTitle: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Component breakdown
  componentRow: {
    marginBottom: 16,
  },
  componentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  componentLabel: {
    ...typography.body,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  componentScore: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontWeight: '700',
  },
  componentBarBackground: {
    height: 4,
    backgroundColor: palette.elevated,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  componentBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: palette.primary,
  },
  componentDetail: {
    ...typography.caption,
    color: palette.textMuted,
  },

  // Reasoning
  reasoning: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },

  // Baseline building state
  baselineContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  baselineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  baselineTitle: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  baselineDays: {
    ...typography.subheading,
    color: palette.primary,
    fontWeight: '700',
  },
  baselineProgressBackground: {
    height: 8,
    backgroundColor: palette.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 16,
  },
  baselineProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  baselineMessage: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  baselineHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.elevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  baselineHintIcon: {
    fontSize: 14,
  },
  baselineHintText: {
    ...typography.caption,
    color: palette.textMuted,
  },
});

export default RecoveryScoreCard;
