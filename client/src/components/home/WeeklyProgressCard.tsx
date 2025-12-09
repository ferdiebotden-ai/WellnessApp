/**
 * WeeklyProgressCard
 *
 * Displays weekly protocol adherence with dots and link to Weekly Synthesis.
 * Shows top 3 protocols by completion count.
 *
 * @file client/src/components/home/WeeklyProgressCard.tsx
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { AdherenceDots } from './AdherenceDots';

export interface ProtocolProgress {
  /** Protocol identifier */
  id: string;
  /** Protocol display name */
  name: string;
  /** Number of days completed in the last 7 days */
  completedDays: number;
  /** Total days (always 7) */
  totalDays: number;
}

interface Props {
  /** Array of protocol progress data (top 3 shown) */
  protocols: ProtocolProgress[];
  /** Callback when "See Weekly Synthesis" is pressed */
  onSynthesisPress?: () => void;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Test ID for testing */
  testID?: string;
}

export const WeeklyProgressCard: React.FC<Props> = ({
  protocols,
  onSynthesisPress,
  loading = false,
  testID = 'weekly-progress-card',
}) => {
  // Only show if we have at least some data
  if (protocols.length === 0 && !loading) {
    return null;
  }

  // Take top 3 protocols
  const topProtocols = protocols.slice(0, 3);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.sectionTitle}>WEEKLY PROGRESS</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      ) : (
        <View style={styles.protocolList}>
          {topProtocols.map((protocol) => (
            <View key={protocol.id} style={styles.protocolRow}>
              <Text style={styles.protocolName} numberOfLines={1}>
                {protocol.name}
              </Text>
              <AdherenceDots
                completed={protocol.completedDays}
                total={protocol.totalDays}
                testID={`${testID}-dots-${protocol.id}`}
              />
            </View>
          ))}
        </View>
      )}

      {/* Link to Weekly Synthesis */}
      {onSynthesisPress && (
        <Pressable
          onPress={onSynthesisPress}
          style={({ pressed }) => [
            styles.synthesisLink,
            pressed && styles.synthesisLinkPressed,
          ]}
          accessibilityRole="link"
          accessibilityLabel="See Weekly Synthesis"
          hitSlop={8}
          testID={`${testID}-synthesis-link`}
        >
          <Text style={styles.synthesisText}>See Weekly Synthesis</Text>
          <Text style={styles.synthesisArrow}>→</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: palette.textMuted,
  },
  protocolList: {
    gap: 12,
  },
  protocolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protocolName: {
    ...typography.body,
    color: palette.textSecondary,
    flex: 1,
    marginRight: 16,
  },
  synthesisLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: 6,
  },
  synthesisLinkPressed: {
    opacity: 0.7,
  },
  synthesisText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
  },
  synthesisArrow: {
    fontSize: 16,
    color: palette.primary,
  },
});

export default WeeklyProgressCard;
