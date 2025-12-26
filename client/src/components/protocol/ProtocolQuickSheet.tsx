/**
 * ProtocolQuickSheet
 *
 * A 60% height bottom sheet for quick protocol viewing and actions.
 * Shows protocol info, "Why This Works", and action buttons.
 * Provides progressive disclosure: glance -> expand -> full detail.
 *
 * Session 86: Protocol UI/UX Redesign
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';
import type { ScheduledProtocol } from '../../hooks/useEnrolledProtocols';
import { getProtocolIcon, getProtocolEmoji } from '../../utils/protocolIcons';

interface Props {
  visible: boolean;
  protocol: ScheduledProtocol | null;
  onClose: () => void;
  onMarkComplete: (protocol: ScheduledProtocol) => void;
  onAskAICoach: (protocol: ScheduledProtocol) => void;
  onViewFullDetails: (protocol: ScheduledProtocol) => void;
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
 * Expandable section component for progressive disclosure
 */
interface ExpandableSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon} size={18} color={palette.textSecondary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={palette.textMuted}
        />
      </Pressable>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

export const ProtocolQuickSheet: React.FC<Props> = ({
  visible,
  protocol,
  onClose,
  onMarkComplete,
  onAskAICoach,
  onViewFullDetails,
  isCompleting = false,
  completionSuccess = false,
}) => {
  if (!protocol) return null;

  const { name, category, summary, duration_minutes } = protocol.protocol;
  const categoryColor = CATEGORY_COLORS[category?.toLowerCase()] || palette.primary;

  // Get protocol icon
  const protocolSlug = name.toLowerCase().replace(/\s+/g, '_');
  const IconComponent = getProtocolIcon(protocolSlug);
  const emoji = getProtocolEmoji(protocolSlug);

  // Parse summary into bullet points if it contains periods
  const instructions = summary
    ? summary.split('.').filter(s => s.trim().length > 0).map(s => s.trim())
    : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheet}>
              {/* Session 91: Success Overlay */}
              {completionSuccess && (
                <View style={styles.successOverlay}>
                  <View style={styles.successIconContainer}>
                    <Ionicons name="checkmark-circle" size={72} color={palette.success} />
                  </View>
                  <Text style={styles.successText}>Protocol Complete!</Text>
                </View>
              )}

              {/* Handle */}
              <View style={styles.handle} />

              {/* Header with close button */}
              <View style={styles.header}>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={palette.textSecondary} />
                </Pressable>
              </View>

              {/* Scrollable Content - Session 87: Added scroll indicator for better UX */}
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentInner}
                showsVerticalScrollIndicator={true}
                indicatorStyle="white"
                bounces={true}
                alwaysBounceVertical={true}
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

                {/* What to Do - Always visible */}
                <View style={styles.whatToDoSection}>
                  <View style={styles.whatToDoHeader}>
                    <Ionicons name="list-outline" size={18} color={palette.primary} />
                    <Text style={styles.whatToDoTitle}>WHAT TO DO</Text>
                  </View>
                  <View style={styles.instructionsList}>
                    {instructions.length > 0 ? (
                      instructions.map((instruction, index) => (
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

                {/* Why This Works - Expandable */}
                <ExpandableSection
                  title="Why This Works"
                  icon="bulb-outline"
                  defaultExpanded
                >
                  <Text style={styles.contentText}>
                    {summary || 'Evidence-based protocol designed to optimize your wellness.'}
                  </Text>
                  <Text style={styles.citationHint}>
                    Tap "View Full Details" for research citations
                  </Text>
                </ExpandableSection>

                {/* Your Progress - Expandable */}
                <ExpandableSection
                  title="Your Progress"
                  icon="bar-chart-outline"
                >
                  <View style={styles.progressStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>-</Text>
                      <Text style={styles.statLabel}>This Week</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>-</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>-</Text>
                      <Text style={styles.statLabel}>Streak</Text>
                    </View>
                  </View>
                  <Text style={styles.progressHint}>
                    Complete this protocol to start tracking your progress
                  </Text>
                </ExpandableSection>

                {/* View Full Details Link */}
                <Pressable
                  style={styles.viewDetailsLink}
                  onPress={() => onViewFullDetails(protocol)}
                >
                  <Text style={styles.viewDetailsText}>View Full Details</Text>
                  <Ionicons name="arrow-forward" size={16} color={palette.primary} />
                </Pressable>
              </ScrollView>

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
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '90%',
    // Session 87: Removed minHeight to allow content to determine sheet size
    // Content-driven height provides better UX for varying protocol lengths
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

  handle: {
    width: 40,
    height: 4,
    backgroundColor: palette.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },

  // Scroll Content - Session 87: Fixed flex constraints for proper scrolling
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24, // Extra padding for scroll end
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

  // Expandable Sections
  section: {
    backgroundColor: palette.elevated,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontSize: 15,
  },
  sectionContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
  contentText: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  citationHint: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
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
    fontSize: 24,
  },
  statLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  progressHint: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // View Details Link
  viewDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 8,
  },
  viewDetailsText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
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
