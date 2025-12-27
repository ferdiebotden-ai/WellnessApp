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
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProtocolDetail } from '../hooks/useProtocolDetail';
import { enqueueProtocolLog } from '../services/protocolLogs';
import { CompletionModal } from '../components/protocol/CompletionModal';
import { ProtocolHeroIcon } from '../components/protocol/ProtocolHeroIcon';
import { PrimaryButton } from '../components/PrimaryButton';
// Session 86: AI Coach integration
import { ChatModal, ChatContext } from '../components/ChatModal';
import { ApexLoadingIndicator } from '../components/ui/ApexLoadingIndicator';
// Session 97: Use shared AnimatedExpandableSection component
import { AnimatedExpandableSection } from '../components/ui/AnimatedExpandableSection';
import { Card } from '../components/ui/Card';
import { palette } from '../theme/palette';
import { typography, fontFamily } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { haptic } from '../utils/haptics';
import type { ImplementationMethod } from '../types/protocol';

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

type ProtocolCategory = 'foundation' | 'performance' | 'recovery' | 'optimization' | 'meta';

const CATEGORY_COLORS: Record<ProtocolCategory, string> = {
  foundation: palette.secondary,
  performance: palette.primary,
  recovery: palette.accent,
  optimization: palette.success,
  meta: '#8B5CF6', // Purple for meta protocols
};

const CATEGORY_LABELS: Record<ProtocolCategory, string> = {
  foundation: 'FOUNDATION',
  performance: 'PERFORMANCE',
  recovery: 'RECOVERY',
  optimization: 'OPTIMIZATION',
  meta: 'META',
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

/** Method Card for implementation options */
interface MethodCardProps {
  method: ImplementationMethod;
}

const MethodCard: React.FC<MethodCardProps> = ({ method }) => {
  // Map icon string to Ionicons name (with fallback)
  const getIconName = (iconHint?: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      sunny: 'sunny',
      bulb: 'bulb',
      flashlight: 'flashlight',
      fitness: 'fitness',
      water: 'water',
      thermometer: 'thermometer',
      bed: 'bed',
      cafe: 'cafe',
      leaf: 'leaf',
    };
    return iconMap[iconHint || ''] || 'checkmark-circle';
  };

  return (
    <View style={styles.methodCard}>
      <View style={styles.methodIconContainer}>
        <Ionicons
          name={getIconName(method.icon)}
          size={24}
          color={palette.primary}
        />
      </View>
      <View style={styles.methodContent}>
        <Text style={styles.methodName}>{method.name}</Text>
        <Text style={styles.methodDescription}>{method.description}</Text>
      </View>
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
  const { protocol, userData, confidence, status, error, reload } = useProtocolDetail(protocolId);
  const [logStatus, setLogStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [logError, setLogError] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Session 86: AI Coach modal state
  const [showChatModal, setShowChatModal] = useState(false);

  // Parsed content
  const bullets = useMemo(() => parseDescription(protocol?.description), [protocol?.description]);
  const citations = protocol?.citations ?? [];
  const displayName = protocol?.name ?? protocolName ?? 'Protocol';
  const moduleId = routeModuleId;

  // Format user data for display
  const formatLastCompleted = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `Today at ${displayHours}:${displayMinutes} ${ampm}`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatDifficultyRating = (avg: number | null): string => {
    if (avg === null) return 'Not rated';
    const stars = Math.round(avg);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  // Session 86: Handle Ask AI Coach button
  const handleAskAICoach = useCallback(() => {
    haptic.light();
    setShowChatModal(true);
  }, []);

  // Build chat context for AI Coach
  const chatContext: ChatContext = useMemo(() => ({
    type: 'protocol',
    protocolId,
    protocolName: displayName,
    mechanism: protocol?.mechanism_description || (typeof protocol?.description === 'string' ? protocol.description : undefined),
  }), [protocolId, displayName, protocol?.mechanism_description, protocol?.description]);

  // Show the completion modal when button is pressed
  const handleMarkComplete = useCallback(() => {
    if (!protocolId || !moduleId) {
      setLogStatus('error');
      setLogError('Module context missing.');
      return;
    }
    setShowCompletionModal(true);
  }, [protocolId, moduleId]);

  // Called when user completes the modal with rating/notes
  const handleLogComplete = useCallback(async (
    difficultyRating: number | null,
    notes: string | null
  ) => {
    setShowCompletionModal(false);
    setLogStatus('pending');
    setLogError(null);

    try {
      void haptic.success();
      await enqueueProtocolLog({
        protocolId: protocolId!,
        moduleId: moduleId!,
        enrollmentId,
        source,
        progressTarget,
        difficultyRating: difficultyRating ?? undefined,
        notes: notes ?? undefined,
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

  // Called when user skips the modal (logs without rating)
  const handleSkipModal = useCallback(() => {
    handleLogComplete(null, null);
  }, [handleLogComplete]);

  // Called when user cancels the modal
  const handleCancelModal = useCallback(() => {
    setShowCompletionModal(false);
  }, []);

  // Open DOI link in browser
  const handleOpenCitation = useCallback((link: string) => {
    if (!link) return;
    void Linking.openURL(link);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Section with Protocol Icon */}
        <View style={styles.heroSection}>
          <ProtocolHeroIcon
            protocolId={protocolId}
            size={80}
            animationDelay={100}
          />
          <CategoryBadge category={(protocol?.category?.toLowerCase() as ProtocolCategory) || 'foundation'} />
          <Text accessibilityRole="header" style={styles.title}>
            {displayName}
          </Text>
        </View>

        {/* Loading State */}
        {status === 'loading' && (
          <View style={styles.centered}>
            <ApexLoadingIndicator size={48} />
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

            {/* Implementation Methods (Session 63) */}
            {protocol.implementation_methods && protocol.implementation_methods.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>WAYS TO DO THIS</Text>
                <Text style={styles.methodsIntro}>
                  Choose whichever method works best for your situation:
                </Text>
                <View style={styles.methodsContainer}>
                  {protocol.implementation_methods.map((method) => (
                    <MethodCard key={method.id} method={method} />
                  ))}
                </View>
              </View>
            )}

            {/* 4-Panel Why? Sections */}
            <View style={styles.whySection}>
              {/* Mechanism */}
              <AnimatedExpandableSection title="Why This Works" icon="🧬" defaultExpanded>
                <Text style={styles.mechanismText}>
                  {protocol.mechanism_description ||
                    'This protocol works by signaling your body\'s natural systems to adapt. When practiced consistently, it helps establish healthier patterns that compound over time.'}
                </Text>
                <Text style={styles.caveatText}>
                  Note: Individual response varies based on genetics and baseline health.
                </Text>
              </AnimatedExpandableSection>

              {/* Evidence */}
              <AnimatedExpandableSection title="Research & Evidence" icon="📊">
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
              </AnimatedExpandableSection>

              {/* Your Data */}
              <AnimatedExpandableSection title="Your Data" icon="📈">
                {userData.memory_insight ? (
                  <Text style={styles.yourDataText}>{userData.memory_insight}</Text>
                ) : userData.total_completions > 0 ? (
                  <Text style={styles.yourDataText}>
                    You've completed this protocol {userData.total_completions} time{userData.total_completions !== 1 ? 's' : ''}.
                  </Text>
                ) : (
                  <Text style={styles.yourDataText}>
                    Complete this protocol to start tracking your patterns.
                  </Text>
                )}
                <View style={styles.dataPointRow}>
                  <Text style={styles.dataPointLabel}>This week</Text>
                  <Text style={styles.dataPointValue}>{userData.adherence_7d}/7 days</Text>
                </View>
                <View style={styles.dataPointRow}>
                  <Text style={styles.dataPointLabel}>Last completed</Text>
                  <Text style={styles.dataPointValue}>{formatLastCompleted(userData.last_completed_at)}</Text>
                </View>
                {userData.difficulty_avg !== null && (
                  <View style={styles.dataPointRow}>
                    <Text style={styles.dataPointLabel}>Your difficulty</Text>
                    <Text style={styles.dataPointValue}>{formatDifficultyRating(userData.difficulty_avg)}</Text>
                  </View>
                )}
              </AnimatedExpandableSection>

              {/* Confidence */}
              <AnimatedExpandableSection title="Our Confidence" icon="🎯">
                <ConfidenceIndicator level={confidence.level} />
                <Text style={styles.confidenceExplainer}>
                  {confidence.reasoning}
                </Text>
                <View style={styles.confidenceFactors}>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Goal Fit</Text>
                    <View style={styles.factorBar}>
                      <View style={[styles.factorFill, { width: `${confidence.factors.protocol_fit * 100}%` }]} />
                    </View>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Memory</Text>
                    <View style={styles.factorBar}>
                      <View style={[styles.factorFill, { width: `${confidence.factors.memory_support * 100}%` }]} />
                    </View>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Timing</Text>
                    <View style={styles.factorBar}>
                      <View style={[styles.factorFill, { width: `${confidence.factors.timing_fit * 100}%` }]} />
                    </View>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>No Conflicts</Text>
                    <View style={styles.factorBar}>
                      <View style={[styles.factorFill, { width: `${confidence.factors.conflict_risk * 100}%` }]} />
                    </View>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Evidence</Text>
                    <View style={styles.factorBar}>
                      <View style={[styles.factorFill, { width: `${confidence.factors.evidence_strength * 100}%` }]} />
                    </View>
                  </View>
                </View>
              </AnimatedExpandableSection>
            </View>
          </>
        )}
      </ScrollView>

      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletionModal}
        protocolName={displayName}
        onComplete={handleLogComplete}
        onSkip={handleSkipModal}
        onCancel={handleCancelModal}
      />

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <PrimaryButton
            title={logStatus === 'success' ? '✓ Logged' : 'Mark as Complete'}
            onPress={handleMarkComplete}
            loading={logStatus === 'pending'}
            disabled={!moduleId || logStatus === 'pending' || logStatus === 'success'}
            style={[styles.footerButtonMain, logStatus === 'success' ? styles.primaryButtonSuccess : undefined]}
            testID="log-complete-button"
          />
          <Pressable
            style={({ pressed }) => [
              styles.askCoachButton,
              pressed && styles.askCoachButtonPressed,
            ]}
            onPress={handleAskAICoach}
            testID="ask-ai-coach-button"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={palette.primary} />
            <Text style={styles.askCoachText}>Ask AI</Text>
          </Pressable>
        </View>
        {!moduleId && (
          <Text style={styles.footerHint}>
            Select a module to enable logging
          </Text>
        )}
        {logError && <Text style={styles.logErrorText}>{logError}</Text>}
      </View>

      {/* Session 86: AI Coach Modal */}
      <ChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        initialContext={chatContext}
      />
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
    gap: tokens.spacing.md,
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
  },
  title: {
    ...typography.h1,
    color: palette.textPrimary,
    fontSize: 28,
    textAlign: 'center',
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

  // Session 97: Expandable section styles now in AnimatedExpandableSection component

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
    marginBottom: 12,
  },
  confidenceFactors: {
    gap: 8,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorLabel: {
    ...typography.caption,
    color: palette.textMuted,
    width: 80,
  },
  factorBar: {
    flex: 1,
    height: 6,
    backgroundColor: palette.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorFill: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 3,
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
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButtonMain: {
    flex: 1,
  },
  askCoachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${palette.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.primary,
    gap: 6,
    minWidth: 90,
  },
  askCoachButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  askCoachText: {
    ...typography.subheading,
    color: palette.primary,
    fontSize: 14,
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

  // Implementation Methods (Session 63)
  methodsIntro: {
    ...typography.body,
    color: palette.textSecondary,
    marginBottom: 16,
  },
  methodsContainer: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    backgroundColor: palette.elevated,
    borderRadius: 12,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  methodIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${palette.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodContent: {
    flex: 1,
    gap: 4,
  },
  methodName: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontSize: 15,
  },
  methodDescription: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
