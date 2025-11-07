import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface LockedModuleCardProps {
  id: string;
  title: string;
  description: string;
  tier: 'pro' | 'elite';
  onPress: (id: string) => void;
}

/**
 * Displays a locked premium module with tier badge and waitlist affordance.
 */
export const LockedModuleCard: React.FC<LockedModuleCardProps> = ({ id, title, description, tier, onPress }) => {
  const tierLabel = tier === 'pro' ? 'Pro' : 'Elite';

  return (
    <Pressable
      onPress={() => onPress(id)}
      accessibilityRole="button"
      style={styles.card}
      testID={`locked-module-${id}`}
    >
      <View style={styles.headerRow}>
        <View style={[styles.tierBadge, tier === 'elite' ? styles.eliteBadge : null]}>
          <Text style={styles.tierBadgeText}>{tierLabel}</Text>
        </View>
        <Text style={styles.lockedLabel}>Locked</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.cta}>Join waitlist →</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  eliteBadge: {
    backgroundColor: 'rgba(180, 83, 9, 0.16)',
  },
  tierBadgeText: {
    ...typography.caption,
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  lockedLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  description: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  cta: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
