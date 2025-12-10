/**
 * ProtocolDetailScreen
 *
 * Full protocol details with evidence transparency.
 * Features 4-panel "Why?" expansion: Mechanism, Evidence, Your Data, Confidence.
 *
 * Design: Bloomberg Terminal meets Oura Ring - dark mode, data-dense, professional.
 *
 * @file client/src/screens/ProtocolDetailScreen.tsx
 * @session 58
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useProtocolDetail } from '../hooks/useProtocolDetail';
import { enqueueProtocolLog } from '../services/protocolLogs';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface ProtocolDetailScreenProps {
  route: {
    params: {
      protocolId: string;
      protocolName?: string;
      moduleId?: string;
      enrollmentId?: string;
      source?: 'schedule' | 'manual' | 'nudge';
      progressTarget?: number;
    };
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

type ProtocolCategory = 'foundation' | 'performance' | 'recovery' | 'optimization';

const CATEGORY_COLORS: Record<ProtocolCategory, string> = {
  foundation: palette.secondary,
  performance: palette.primary,
  recovery: palette.accent,
  optimization: palette.success,
};

const CATEGORY_LABELS: Record<ProtocolCategory, string> = {
  foundation: 'FOUNDATION',
  performance: 'PERFORMANCE',
  recovery: 'RECOVERY',
  optimization: 'OPTIMIZATION',
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Category badge component */
const CategoryBadge: React.FC<{ category?: ProtocolCategory }> = ({ category = 'foundation' }) => {
  const color = CATEGORY_COLORS[category] || palette.secondary;
  const label = CATEGORY_LABELS[category] || 'PROTOCOL';

  return (
    <View style={[styles.categoryBadge, { backgroundColor: `${color}20` }]}>
      <View style={[styles.categoryDot, { backgroundColor: color }]} />
      <Text style={[styles.categoryText, { color }]}>{label}</Text>
    </View>
  );
};

/** Expandable section with animated height */
interface ExpandableSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useSharedValue(defaultExpanded ? 1 : 0);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && contentHeight === 0) {
      setContentHeight(height);
    }
  }, [contentHeight]);

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
    if (contentHeight === 0) {
      return { height: 0, opacity: 0, overflow: 'hidden' as const };
    }

    return {
      height: interpolate(animatedHeight.value, [0, 1], [0, contentHeight]),
      opacity: interpolate(animatedHeight.value, [0, 0.5, 1], [0, 0.5, 1]),
      overflow: 'hidden' as const,
    };
  });

  return (
    <View style={styles.expandableSection}>
      <Pressable
        onPress={toggleExpand}
        style={({ pressed }) => [
          styles.expandableHeader,
          pressed && styles.expandableHeaderPressed,
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} ${title}`}
      >
        <View style={styles.expandableHeaderLeft}>
          <Text style={styles.expandableIcon}>{icon}</Text>
          <Text style={styles.expandableTitle}>{title}</Text>
        </View>
        <Text style={styles.expandableChevron}>
          {isExpanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      <Animated.View style={expandStyle}>
        <View onLayout={handleContentLayout} style={styles.expandableContent}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

/** Confidence indicator (High/Medium/Low) */
const ConfidenceIndicator: React.FC<{ level?: 'high' | 'medium' | 'low' }> = ({ level = 'medium' }) => {
  const config = {
    high: { dots: 3, color: palette.success, label: 'High Confidence' },
    medium: { dots: 2, color: palette.accent, label: 'Medium Confidence' },
    low: { dots: 1, color: palette.error, label: 'Low Confidence' },
  };
  const { dots, color, label } = config[level];

  return (
    <View style={styles.confidenceRow}>
      <View style={styles.confidenceDots}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.confidenceDot,
              i <= dots && { backgroundColor: color },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.confidenceLabel, { color }]}>{label}</Text>
    </View>
  );
};

// =============================================================================
// HELPERS
// =============================================================================

const parseDescription = (description?: string | string[]) => {
  if (!description) {
    return [] as string[];
  }

  const segments = Array.isArray(description)
    ? description
    : description
        .split(/\r?\n|\u2022/)
        .map((segment) => segment.replace(/^\s*[\u2022\-]+\s*/, ''));

  return segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .slice(0, 3);
};

export const ProtocolDetailScreen: React.FC<ProtocolDetailScreenProps> = ({ route }) => {
  const { protocolId, protocolName, moduleId: routeModuleId, enrollmentId, source, progressTarget } = route.params;
  const { protocol, status, error, reload } = useProtocolDetail(protocolId);
  const [logStatus, setLogStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [logError, setLogError] = useState<string | null>(null);

  // Parsed content
  const bullets = useMemo(() => parseDescription(protocol?.description), [protocol?.description]);
  const citations = protocol?.citations ?? [];
  const displayName = protocol?.name ?? protocolName ?? 'Protocol';
  const moduleId = routeModuleId;

  const handleLogComplete = useCallback(async () => {
    if (!protocolId || !moduleId) {
      setLogStatus('error');
      setLogError('Module context missing.');
      return;
    }

    setLogStatus('pending');
    setLogError(null);

    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await enqueueProtocolLog({
        protocolId,
        moduleId,
        enrollmentId,
        source,
        progressTarget,
        metadata: {
          protocolName: displayName,
        },
      });
      setLogStatus('success');
    } catch (logErr) {
      setLogStatus('error');
      setLogError(logErr instanceof Error ? logErr.message : 'Unable to log protocol right now.');
    }
  }, [protocolId, moduleId, enrollmentId, source, progressTarget, displayName]);

  // Open DOI link in browser
  const handleOpenCitation = useCallback((link: string) => {
    if (!link) return;
    void Linking.openURL(link);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <CategoryBadge />
          <Text accessibilityRole="header" style={styles.title}>
            {displayName}
          </Text>
        </View>

        {/* Loading State */}
        {status === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>Loading protocol...</Text>
          </View>
        )}

        {/* Error State */}
        {status === 'error' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error ?? 'Unable to load protocol details.'}</Text>
            <Pressable onPress={() => reload()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {/* Main Content */}
        {protocol && (
          <>
            {/* What To Do */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>WHAT TO DO</Text>
              {bullets.length > 0 ? (
                bullets.map((bullet, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bulletMarker}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.placeholderText}>Protocol instructions coming soon.</Text>
              )}
            </View>

            {/* 4-Panel Why? Sections */}
            <View style={styles.whySection}>
              {/* Mechanism */}
              <ExpandableSection title="Why This Works" icon="🧬">
                <Text style={styles.mechanismText}>
                  This protocol works by signaling your body's natural systems to adapt.
                  When practiced consistently, it helps establish healthier patterns
                  that compound over time.
                </Text>
                <Text style={styles.caveatText}>
                  Note: Individual response varies based on genetics and baseline health.
                </Text>
              </ExpandableSection>

              {/* Evidence */}
              <ExpandableSection title="Research & Evidence" icon="📊">
                {citations.length > 0 ? (
                  citations.map((citation, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleOpenCitation(citation)}
                      accessibilityRole="link"
                      style={({ pressed }) => [
                        styles.citationRow,
                        pressed && styles.citationRowPressed,
                      ]}
                    >
                      <Text style={styles.citationText}>{citation}</Text>
                      <Text style={styles.citationLink}>Open →</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.placeholderText}>
                    Evidence citations will be added soon.
                  </Text>
                )}
              </ExpandableSection>

              {/* Your Data */}
              <ExpandableSection title="Your Data" icon="📈">
                <Text style={styles.yourDataText}>
                  Based on your recent patterns, this protocol aligns with your current
                  recovery status and goals.
                </Text>
                <View style={styles.dataPointRow}>
                  <Text style={styles.dataPointLabel}>Adherence (7 days)</Text>
                  <Text style={styles.dataPointValue}>—</Text>
                </View>
                <View style={styles.dataPointRow}>
                  <Text style={styles.dataPointLabel}>Last completed</Text>
                  <Text style={styles.dataPointValue}>—</Text>
                </View>
              </ExpandableSection>

              {/* Confidence */}
              <ExpandableSection title="Our Confidence" icon="🎯">
                <ConfidenceIndicator level="medium" />
                <Text style={styles.confidenceExplainer}>
                  Confidence is calculated from: data days available, correlation
                  strength, baseline stability, user data volatility, and extrapolation risk.
                </Text>
                <Text style={styles.caveatText}>
                  Based on population averages; individual results vary.
                </Text>
              </ExpandableSection>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !moduleId || logStatus === 'pending' || logStatus === 'success' }}
          disabled={!moduleId || logStatus === 'pending' || logStatus === 'success'}
          onPress={handleLogComplete}
          style={({ pressed }) => [
            styles.primaryButton,
            logStatus === 'success' && styles.primaryButtonSuccess,
            !moduleId && styles.primaryButtonDisabled,
            pressed && styles.primaryButtonPressed,
          ]}
          testID="log-complete-button"
        >
          {logStatus === 'pending' ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {logStatus === 'success' ? '✓ Logged' : 'Mark as Complete'}
            </Text>
          )}
        </Pressable>
        {!moduleId && (
          <Text style={styles.footerHint}>
            Select a module to enable logging
          </Text>
        )}
        {logError && <Text style={styles.logErrorText}>{logError}</Text>}
      </View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 24,
  },

  // Hero Section
  heroSection: {
    gap: 12,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
    fontSize: 28,
  },

  // Category Badge
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Loading State
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.body,
    color: palette.textMuted,
  },

  // Error State
  errorCard: {
    backgroundColor: palette.errorMuted,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  errorText: {
    ...typography.body,
    color: palette.error,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
  },

  // Content Card
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 4,
  },

  // Bullet Points
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletMarker: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  placeholderText: {
    ...typography.body,
    color: palette.textMuted,
    fontStyle: 'italic',
  },

  // Why? Sections Container
  whySection: {
    gap: 12,
  },

  // Expandable Section
  expandableSection: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  expandableHeaderPressed: {
    backgroundColor: palette.elevated,
  },
  expandableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandableIcon: {
    fontSize: 18,
  },
  expandableTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  expandableChevron: {
    fontSize: 10,
    color: palette.textMuted,
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },

  // Mechanism Section
  mechanismText: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  caveatText: {
    ...typography.caption,
    color: palette.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Evidence/Citations
  citationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  citationRowPressed: {
    opacity: 0.7,
  },
  citationText: {
    flex: 1,
    ...typography.body,
    color: palette.secondary,
    marginRight: 8,
  },
  citationLink: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
  },

  // Your Data Section
  yourDataText: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  dataPointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  dataPointLabel: {
    ...typography.body,
    color: palette.textMuted,
  },
  dataPointValue: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontWeight: '600',
  },

  // Confidence Section
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  confidenceDots: {
    flexDirection: 'row',
    gap: 4,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.elevated,
  },
  confidenceLabel: {
    ...typography.subheading,
    fontWeight: '600',
  },
  confidenceExplainer: {
    ...typography.caption,
    color: palette.textMuted,
    lineHeight: 18,
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
    gap: 8,
  },
  footerHint: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
  },

  // Primary Button
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    ...typography.subheading,
    color: palette.background,
    fontWeight: '700',
  },
  primaryButtonSuccess: {
    backgroundColor: palette.success,
  },
  primaryButtonDisabled: {
    backgroundColor: palette.elevated,
  },
  logErrorText: {
    ...typography.caption,
    color: palette.error,
    textAlign: 'center',
  },
});
