/**
 * ProtocolQuickSheet
 *
 * Enhanced bottom sheet for protocol viewing with full evidence panels.
 * Provides progressive disclosure: glance (50%) -> expand (90%) with all details.
 *
 * Session 86: Protocol UI/UX Redesign
 * Session 92: Upgraded to @gorhom/bottom-sheet for native drag gestures
 * Session 97: MVP-006 - Added 4 evidence panels, removed View Full Details
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { AnimatedExpandableSection } from '../ui/AnimatedExpandableSection';
import { useProtocolDetailSheet } from '../../hooks/useProtocolDetailSheet';
import type { ScheduledProtocol } from '../../hooks/useEnrolledProtocols';
import { getProtocolIcon, getProtocolEmoji } from '../../utils/protocolIcons';

interface Props {
  visible: boolean;
  protocol: ScheduledProtocol | null;
  onClose: () => void;
  onMarkComplete: (protocol: ScheduledProtocol) => void;
  onAskAICoach: (protocol: ScheduledProtocol) => void;
  isCompleting?: boolean;
  /** Session 91: Show success state after completion */
  completionSuccess?: boolean;
}

/**
 * Category colors matching the app's design system
 */
const CATEGORY_COLORS: Record<string, string> = {
  foundation: palette.secondary,
  performance: palette.primary,
  recovery: palette.accent,
  optimization: palette.success,
  meta: '#8B5CF6',
};

/**
 * Skeleton loader for content while fetching
 */
const SkeletonLoader: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <View style={styles.skeletonContainer}>
    {Array.from({ length: lines }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.skeletonLine,
          { width: i === lines - 1 ? '60%' : '100%' },
        ]}
      />
    ))}
  </View>
);

export const ProtocolQuickSheet: React.FC<Props> = ({
  visible,
  protocol,
  onClose,
  onMarkComplete,
  onAskAICoach,
  isCompleting = false,
  completionSuccess = false,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Fetch full protocol data when sheet opens
  const {
    status,
    instructions,
    mechanismText,
    studySources,
    userData,
    lastCompletedFormatted,
  } = useProtocolDetailSheet(visible && protocol ? protocol.protocol_id : null);

  // Snap points: 50% start, 90% expanded
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  // Control sheet visibility based on prop
  useEffect(() => {
    if (visible && protocol) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, protocol]);

  // Handle sheet close
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  // Render backdrop with tap-to-close
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  // Open DOI link in browser
  const handleOpenDOI = useCallback((doi: string | undefined) => {
    if (doi) {
      const url = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
      Linking.openURL(url);
    }
  }, []);

  // Don't render anything if no protocol
  if (!protocol) return null;

  const { name, category, summary, duration_minutes } = protocol.protocol;
  const categoryColor = CATEGORY_COLORS[category?.toLowerCase()] || palette.primary;

  // Get protocol icon
  const protocolSlug = name.toLowerCase().replace(/\s+/g, '_');
  const IconComponent = getProtocolIcon(protocolSlug);
  const emoji = getProtocolEmoji(protocolSlug);

  // Use fetched instructions or fall back to summary-based parsing
  const displayInstructions = instructions.length > 0
    ? instructions
    : summary
      ? summary.split('.').filter(s => s.trim().length > 0).map(s => s.trim())
      : [];

  const isLoading = status === 'loading';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      onChange={handleSheetChange}
    >
      {/* Session 91: Success Overlay */}
      {completionSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={72} color={palette.success} />
          </View>
          <Text style={styles.successText}>Protocol Complete!</Text>
        </View>
      )}

      {/* Scrollable Content */}
      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Protocol Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}15` }]}>
            {IconComponent ? (
              <IconComponent size={32} color={categoryColor} />
            ) : (
              <Text style={styles.iconEmoji}>{emoji}</Text>
            )}
          </View>
          <Text style={styles.protocolName}>{name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {category?.toUpperCase() || 'PROTOCOL'}
              </Text>
            </View>
            {duration_minutes && (
              <Text style={styles.duration}>{duration_minutes} min</Text>
            )}
            {protocol.isDueNow && (
              <View style={styles.nowBadge}>
                <Text style={styles.nowBadgeText}>NOW</Text>
              </View>
            )}
          </View>
        </View>

        {/* What to Do - Always visible, expanded by default */}
        <View style={styles.whatToDoSection}>
          <View style={styles.whatToDoHeader}>
            <Ionicons name="list-outline" size={18} color={palette.primary} />
            <Text style={styles.whatToDoTitle}>WHAT TO DO</Text>
          </View>
          <View style={styles.instructionsList}>
            {isLoading ? (
              <SkeletonLoader lines={3} />
            ) : displayInstructions.length > 0 ? (
              displayInstructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.instructionText}>
                Complete this protocol according to your preferences.
              </Text>
            )}
          </View>
        </View>

        {/* Why This Works - Collapsed */}
        <AnimatedExpandableSection
          title="Why This Works"
          icon="bulb-outline"
          iconType="ionicon"
        >
          {isLoading ? (
            <SkeletonLoader lines={4} />
          ) : (
            <>
              <Text style={styles.contentText}>
                {mechanismText || summary || 'Evidence-based protocol designed to optimize your wellness.'}
              </Text>
              <Text style={styles.caveatText}>
                Note: Individual response varies based on genetics and baseline health.
              </Text>
            </>
          )}
        </AnimatedExpandableSection>

        {/* Research & Evidence - Collapsed */}
        <AnimatedExpandableSection
          title="Research & Evidence"
          icon="document-text-outline"
          iconType="ionicon"
        >
          {isLoading ? (
            <SkeletonLoader lines={3} />
          ) : studySources.length > 0 ? (
            <View style={styles.citationsList}>
              {studySources.map((source, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.citationItem,
                    pressed && styles.citationPressed,
                  ]}
                  onPress={() => handleOpenDOI(source.doi)}
                >
                  <View style={styles.citationContent}>
                    <Text style={styles.citationAuthor}>
                      {source.author} ({source.year})
                    </Text>
                    {source.title && (
                      <Text style={styles.citationTitle} numberOfLines={2}>
                        {source.title}
                      </Text>
                    )}
                    {source.journal && (
                      <Text style={styles.citationJournal}>{source.journal}</Text>
                    )}
                  </View>
                  {source.doi && (
                    <Ionicons name="open-outline" size={16} color={palette.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              Research citations will be added soon.
            </Text>
          )}
        </AnimatedExpandableSection>

        {/* Your Data - Collapsed */}
        <AnimatedExpandableSection
          title="Your Data"
          icon="analytics-outline"
          iconType="ionicon"
        >
          {isLoading ? (
            <SkeletonLoader lines={2} />
          ) : userData.total_completions > 0 ? (
            <>
              {userData.memory_insight && (
                <View style={styles.insightBox}>
                  <Ionicons name="sparkles" size={14} color={palette.accent} />
                  <Text style={styles.insightText}>{userData.memory_insight}</Text>
                </View>
              )}
              <View style={styles.progressStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userData.adherence_7d}/7</Text>
                  <Text style={styles.statLabel}>This Week</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userData.total_completions}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lastCompletedFormatted}</Text>
                  <Text style={styles.statLabel}>Last</Text>
                </View>
              </View>
              {userData.difficulty_avg && (
                <View style={styles.difficultyRow}>
                  <Text style={styles.difficultyLabel}>Avg. Difficulty:</Text>
                  <View style={styles.difficultyStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(userData.difficulty_avg!) ? 'star' : 'star-outline'}
                        size={14}
                        color={palette.accent}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.placeholderText}>
              Complete this protocol to start tracking your patterns.
            </Text>
          )}
        </AnimatedExpandableSection>
      </BottomSheetScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View style={styles.actionsContainer}>
        {/* Mark Complete Button */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            isCompleting && styles.buttonDisabled,
          ]}
          onPress={() => onMarkComplete(protocol)}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <ActivityIndicator size="small" color={palette.background} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={palette.background} />
              <Text style={styles.primaryButtonText}>Mark Complete</Text>
            </>
          )}
        </Pressable>

        {/* Ask AI Coach Button */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => onAskAICoach(protocol)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={palette.primary} />
          <Text style={styles.secondaryButtonText}>Ask AI Coach</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // Sheet Background
  sheetBackground: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: palette.border,
    width: 40,
    height: 4,
  },

  // Session 91: Success Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    gap: 16,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${palette.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    ...typography.heading,
    color: palette.success,
    fontSize: 20,
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconEmoji: {
    fontSize: 32,
  },
  protocolName: {
    ...typography.heading,
    color: palette.textPrimary,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  duration: {
    ...typography.body,
    color: palette.textSecondary,
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

  // What To Do Section
  whatToDoSection: {
    backgroundColor: palette.elevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  whatToDoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  whatToDoTitle: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletPoint: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  instructionText: {
    ...typography.body,
    color: palette.textPrimary,
    flex: 1,
    lineHeight: 22,
  },

  // Content text
  contentText: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  caveatText: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Skeleton loader
  skeletonContainer: {
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: palette.elevated,
    borderRadius: 4,
  },

  // Citations
  citationsList: {
    gap: 12,
  },
  citationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: palette.canvas,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  citationPressed: {
    opacity: 0.7,
  },
  citationContent: {
    flex: 1,
    marginRight: 8,
  },
  citationAuthor: {
    ...typography.caption,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  citationTitle: {
    ...typography.caption,
    color: palette.textSecondary,
    marginTop: 2,
  },
  citationJournal: {
    ...typography.caption,
    color: palette.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Placeholder text
  placeholderText: {
    ...typography.body,
    color: palette.textMuted,
    fontStyle: 'italic',
  },

  // Your Data section
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${palette.accent}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  insightText: {
    ...typography.caption,
    color: palette.textPrimary,
    flex: 1,
  },

  // Progress Stats
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading,
    color: palette.textPrimary,
    fontSize: 20,
  },
  statLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 2,
  },

  // Difficulty rating
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  difficultyLabel: {
    ...typography.caption,
    color: palette.textMuted,
  },
  difficultyStars: {
    flexDirection: 'row',
    gap: 2,
  },

  // Action Buttons
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  primaryButtonText: {
    ...typography.subheading,
    color: palette.background,
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${palette.primary}15`,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  secondaryButtonText: {
    ...typography.subheading,
    color: palette.primary,
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
