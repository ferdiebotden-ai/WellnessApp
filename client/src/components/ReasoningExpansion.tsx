import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { WhyExpansion, EvidenceLevel, ConfidenceLevel } from '../types/dashboard';
import type { EdgeCases } from '../types/edgeCases';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { ConfidenceBreakdown } from './ConfidenceBreakdown';
import { EdgeCaseBadgeRow } from './EdgeCaseBadgeRow';

interface Props {
  data: WhyExpansion;
  /** Optional edge cases for contextual badges in Your Data panel */
  edgeCases?: EdgeCases;
}

/**
 * Map evidence level to progress bar fill percentage
 */
const getEvidenceProgress = (level: EvidenceLevel): number => {
  switch (level) {
    case 'Very High': return 1.0;
    case 'High': return 0.8;
    case 'Moderate': return 0.6;
    case 'Emerging': return 0.4;
    default: return 0.5;
  }
};

/**
 * Get confidence level color
 */
const getConfidenceColor = (level: ConfidenceLevel): string => {
  switch (level) {
    case 'High': return palette.success;    // #4CE1A5
    case 'Medium': return palette.accent;   // #EFBF5B
    case 'Low': return palette.textMuted;   // #6C7688
    default: return palette.textMuted;
  }
};

/**
 * 4-panel reasoning expansion for NudgeCard
 * Displays: Mechanism, Evidence, Your Data, Confidence
 */
export const ReasoningExpansion: React.FC<Props> = ({ data, edgeCases }) => {
  const { mechanism, evidence, your_data, confidence } = data;
  const evidenceProgress = getEvidenceProgress(evidence.strength);
  const confidenceColor = getConfidenceColor(confidence.level);

  const handleDOIPress = () => {
    if (evidence.doi) {
      const doiUrl = evidence.doi.startsWith('http')
        ? evidence.doi
        : `https://doi.org/${evidence.doi}`;
      Linking.openURL(doiUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* Panel 1: MECHANISM */}
      <Animated.View
        entering={FadeIn.duration(150).delay(0)}
        style={styles.panel}
      >
        <Text style={styles.sectionHeader}>MECHANISM</Text>
        <Text style={styles.sectionContent}>{mechanism}</Text>
      </Animated.View>

      {/* Panel 2: EVIDENCE */}
      <Animated.View
        entering={FadeIn.duration(150).delay(100)}
        style={styles.panel}
      >
        <Text style={styles.sectionHeader}>EVIDENCE</Text>
        <View style={styles.evidenceRow}>
          <Text style={styles.citationText} numberOfLines={2}>
            {evidence.citation}
          </Text>
          {evidence.doi && (
            <Pressable onPress={handleDOIPress} hitSlop={8}>
              <Text style={styles.doiLink}>DOI ↗</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.strengthRow}>
          <Text style={styles.strengthLabel}>Strength:</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${evidenceProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.strengthValue}>{evidence.strength}</Text>
        </View>
      </Animated.View>

      {/* Panel 3: YOUR DATA */}
      <Animated.View
        entering={FadeIn.duration(150).delay(200)}
        style={styles.panel}
      >
        <Text style={styles.sectionHeader}>YOUR DATA</Text>
        <Text style={styles.sectionContent}>{your_data}</Text>
        {/* Edge case badges when relevant (Session 46) */}
        {edgeCases && (
          <View style={styles.edgeCaseBadgesContainer}>
            <EdgeCaseBadgeRow
              edgeCases={edgeCases}
              size="small"
              maxBadges={2}
              testID="reasoning-edge-case-badges"
            />
          </View>
        )}
      </Animated.View>

      {/* Panel 4: CONFIDENCE */}
      <Animated.View
        entering={FadeIn.duration(150).delay(300)}
        style={[styles.panel, styles.lastPanel]}
      >
        {/* Use ConfidenceBreakdown when factors available (Session 46) */}
        {confidence.factors ? (
          <ConfidenceBreakdown
            factors={confidence.factors}
            level={confidence.level}
            compact
            showHeader
            staggerDelay={40}
            testID="reasoning-confidence-breakdown"
          />
        ) : (
          // Fallback to simple display when factors not available
          <>
            <Text style={styles.sectionHeader}>CONFIDENCE</Text>
            <View style={styles.confidenceRow}>
              <View
                style={[styles.confidenceIndicator, { backgroundColor: confidenceColor }]}
              />
              <Text style={[styles.confidenceLevel, { color: confidenceColor }]}>
                {confidence.level}
              </Text>
              <Text style={styles.confidenceSeparator}>—</Text>
              <Text style={styles.confidenceExplanation}>{confidence.explanation}</Text>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 12,
  },
  panel: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  lastPanel: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  sectionHeader: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionContent: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  edgeCaseBadgesContainer: {
    marginTop: 8,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  citationText: {
    ...typography.body,
    color: palette.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  doiLink: {
    ...typography.caption,
    color: palette.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthLabel: {
    ...typography.caption,
    color: palette.textMuted,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: palette.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 3,
  },
  strengthValue: {
    ...typography.caption,
    color: palette.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  confidenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceLevel: {
    ...typography.body,
    fontWeight: '600',
  },
  confidenceSeparator: {
    ...typography.body,
    color: palette.textMuted,
  },
  confidenceExplanation: {
    ...typography.body,
    color: palette.textSecondary,
    flex: 1,
  },
});
