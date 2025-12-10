import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { ScheduledProtocolCard } from './ScheduledProtocolCard';
import type { ScheduledProtocol } from '../../hooks/useEnrolledProtocols';

interface MyScheduleSectionProps {
  protocols: ScheduledProtocol[];
  loading: boolean;
  error: string | null;
  onProtocolPress: (protocol: ScheduledProtocol) => void;
  onAddProtocol: () => void;
  testID?: string;
}

/**
 * My Schedule section displaying enrolled protocols with times.
 * Includes loading state, empty state, and Add Protocol button.
 */
export const MyScheduleSection: React.FC<MyScheduleSectionProps> = ({
  protocols,
  loading,
  error,
  onProtocolPress,
  onAddProtocol,
  testID,
}) => {
  // Loading state
  if (loading) {
    return (
      <View testID={testID}>
        <Text style={styles.sectionTitle}>MY SCHEDULE</Text>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View testID={testID}>
        <Text style={styles.sectionTitle}>MY SCHEDULE</Text>
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
        <Text style={styles.sectionTitle}>MY SCHEDULE</Text>
        <Pressable
          onPress={onAddProtocol}
          style={({ pressed }) => [
            styles.emptyCard,
            pressed && styles.cardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add your first protocol"
        >
          <Text style={styles.emptyTitle}>No scheduled protocols yet</Text>
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
      <Text style={styles.sectionTitle}>MY SCHEDULE</Text>
      <View style={styles.protocolStack}>
        {protocols.map((protocol) => (
          <ScheduledProtocolCard
            key={protocol.id}
            protocol={protocol}
            onPress={onProtocolPress}
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
