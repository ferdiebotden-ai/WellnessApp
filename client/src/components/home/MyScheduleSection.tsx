import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { SwipeableProtocolCard } from './SwipeableProtocolCard';
import type { ScheduledProtocol } from '../../hooks/useEnrolledProtocols';

interface MyScheduleSectionProps {
  protocols: ScheduledProtocol[];
  loading: boolean;
  error: string | null;
  onProtocolPress: (protocol: ScheduledProtocol) => void;
  onAddProtocol: () => void;
  /** Called when user swipes right to start/complete protocol (only when due now) */
  onProtocolStart?: (protocol: ScheduledProtocol) => void;
  /** Called when user swipes left to remove protocol from schedule */
  onProtocolUnenroll?: (protocol: ScheduledProtocol) => void;
  /** Protocol IDs currently being updated (disables swipe) */
  updatingProtocolIds?: Set<string>;
  testID?: string;
}

/**
 * Today's Protocols section displaying enrolled protocols for today.
 * Session 87: Renamed from "My Schedule" to "Today's Protocols" for clarity.
 * Includes loading state, empty state, and Add Protocol button.
 */
export const MyScheduleSection: React.FC<MyScheduleSectionProps> = ({
  protocols,
  loading,
  error,
  onProtocolPress,
  onAddProtocol,
  onProtocolStart,
  onProtocolUnenroll,
  updatingProtocolIds = new Set(),
  testID,
}) => {
  // Loading state
  if (loading) {
    return (
      <View testID={testID}>
        <Text style={styles.sectionTitle}>TODAY'S PROTOCOLS</Text>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading protocols...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View testID={testID}>
        <Text style={styles.sectionTitle}>TODAY'S PROTOCOLS</Text>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={onAddProtocol} style={styles.retryButton}>
            <Text style={styles.retryText}>Browse Protocols</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Empty state
  if (protocols.length === 0) {
    return (
      <View testID={testID}>
        <Text style={styles.sectionTitle}>TODAY'S PROTOCOLS</Text>
        <Pressable
          onPress={onAddProtocol}
          style={({ pressed }) => [
            styles.emptyCard,
            pressed && styles.cardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add your first protocol"
        >
          <Text style={styles.emptyTitle}>No protocols scheduled</Text>
          <Text style={styles.emptySubtitle}>
            Add protocols to build your daily wellness routine
          </Text>
          <View style={styles.addCTA}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>Add your first protocol</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  // Normal state with protocols
  return (
    <View testID={testID}>
      <Text style={styles.sectionTitle}>TODAY'S PROTOCOLS</Text>
      <View style={styles.protocolStack}>
        {protocols.map((protocol) => (
          <SwipeableProtocolCard
            key={protocol.id}
            protocol={protocol}
            onPress={onProtocolPress}
            onSwipeRight={onProtocolStart}
            onSwipeLeft={onProtocolUnenroll}
            isUpdating={updatingProtocolIds.has(protocol.id)}
            testID={`scheduled-protocol-${protocol.protocol_id}`}
          />
        ))}

        {/* Add Protocol button */}
        <Pressable
          onPress={onAddProtocol}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.cardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add protocol"
          testID="add-protocol-button"
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add Protocol</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 16,
  },
  protocolStack: {
    gap: 12,
  },
  // Loading state
  loadingCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: palette.textMuted,
  },
  // Error state
  errorCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
  },
  // Empty state
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  cardPressed: {
    opacity: 0.7,
  },
  emptyTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  addCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  addIcon: {
    fontSize: 18,
    color: palette.primary,
    fontWeight: '600',
  },
  addText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
  },
  // Add Protocol button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
    paddingVertical: 16,
    gap: 8,
  },
  addButtonIcon: {
    fontSize: 20,
    color: palette.primary,
    fontWeight: '600',
  },
  addButtonText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
  },
});
