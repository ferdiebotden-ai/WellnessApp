/**
 * ModuleListScreen
 *
 * Shows all available modules (focus areas) for the user to browse.
 * Tapping a module navigates to ModuleProtocolsScreen to view its protocols.
 * The primary module is indicated with a badge but selection happens inside.
 *
 * Session 83: Protocol Selection UX Overhaul
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useModules } from '../hooks/useModules';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { ApexLoadingIndicator } from '../components/ui/ApexLoadingIndicator';
import type { ModuleSummary } from '../types/module';
import type { ProtocolsStackParamList } from '../navigation/ProtocolsStack';

type ModuleListScreenProps = NativeStackScreenProps<ProtocolsStackParamList, 'ModuleList'>;

interface ModuleCardProps {
  module: ModuleSummary;
  isPrimary: boolean;
  onPress: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isPrimary,
  onPress,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.moduleCard,
        isPrimary && styles.moduleCardPrimary,
        pressed && styles.moduleCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${module.name}${isPrimary ? ', your current focus' : ''}`}
      accessibilityHint="Tap to view protocols"
      testID={`module-card-${module.id}`}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>YOUR FOCUS</Text>
        </View>
      )}

      {/* Module Header */}
      <View style={styles.moduleHeader}>
        <Text style={[styles.moduleName, isPrimary && styles.moduleNamePrimary]}>
          {module.name}
        </Text>
        <View style={[styles.tierBadge, getTierStyle(module.tier)]}>
          <Text style={styles.tierText}>{module.tier.toUpperCase()}</Text>
        </View>
      </View>

      {/* Headline */}
      <Text style={styles.moduleHeadline}>{module.headline}</Text>

      {/* Description */}
      <Text style={styles.moduleDescription} numberOfLines={2}>
        {module.description}
      </Text>

      {/* Navigation Arrow */}
      <View style={styles.actionRow}>
        <Text style={styles.viewProtocolsText}>View protocols</Text>
        <Ionicons name="chevron-forward" size={18} color={palette.primary} />
      </View>
    </Pressable>
  );
};

const getTierStyle = (tier: string) => {
  switch (tier) {
    case 'core':
      return styles.tierCore;
    case 'pro':
      return styles.tierPro;
    case 'elite':
      return styles.tierElite;
    default:
      return styles.tierCore;
  }
};

export const ModuleListScreen: React.FC<ModuleListScreenProps> = ({ navigation }) => {
  const {
    modules,
    primaryModuleId,
    status,
    error,
    reload,
  } = useModules();

  const handleModulePress = useCallback(
    (module: ModuleSummary) => {
      navigation.navigate('ModuleProtocols', {
        moduleId: module.id,
        moduleName: module.name,
      });
    },
    [navigation]
  );

  // Loading State
  if (status === 'loading') {
    return (
      <View style={styles.centerContainer} testID="modules-loading">
        <ApexLoadingIndicator size={48} />
        <Text style={styles.loadingText}>Loading modules...</Text>
      </View>
    );
  }

  // Error State
  if (status === 'error') {
    return (
      <View style={styles.centerContainer} testID="modules-error">
        <Text style={styles.errorTitle}>Unable to Load Modules</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={reload}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      testID="module-list-screen"
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.heading}>Focus Areas</Text>
        <Text style={styles.subtitle}>
          Browse modules to discover evidence-based protocols for each wellness domain.
        </Text>
      </View>

      {/* Module Grid */}
      <View style={styles.moduleGrid}>
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            isPrimary={module.id === primaryModuleId}
            onPress={() => handleModulePress(module)}
          />
        ))}
      </View>

      {/* Empty State */}
      {modules.length === 0 && status === 'success' && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Modules Available</Text>
          <Text style={styles.emptyMessage}>
            Check back soon as we add more wellness modules.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: palette.background,
    padding: 24,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Header
  headerSection: {
    marginBottom: 24,
  },
  heading: {
    ...typography.heading,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },

  // Module Grid
  moduleGrid: {
    gap: 16,
  },

  // Module Card
  moduleCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    position: 'relative',
    overflow: 'hidden',
  },
  moduleCardPrimary: {
    borderColor: palette.primary,
    borderWidth: 2,
    backgroundColor: palette.elevated,
  },
  moduleCardPressed: {
    backgroundColor: palette.elevated,
    transform: [{ scale: 0.98 }],
  },

  // Primary Badge
  primaryBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  primaryBadgeText: {
    ...typography.caption,
    color: palette.background,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Module Header
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 80,
  },
  moduleName: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontSize: 18,
    flex: 1,
  },
  moduleNamePrimary: {
    color: palette.primary,
  },

  // Tier Badge
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierCore: {
    backgroundColor: palette.successMuted,
  },
  tierPro: {
    backgroundColor: 'rgba(91, 141, 239, 0.2)',
  },
  tierElite: {
    backgroundColor: 'rgba(239, 191, 91, 0.2)',
  },
  tierText: {
    ...typography.caption,
    fontWeight: '600',
    color: palette.textSecondary,
  },

  // Module Content
  moduleHeadline: {
    ...typography.body,
    color: palette.textPrimary,
    fontWeight: '500',
    marginBottom: 8,
  },
  moduleDescription: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: 4,
  },
  viewProtocolsText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
  },

  // Loading State
  loadingText: {
    ...typography.body,
    color: palette.textSecondary,
    marginTop: 12,
  },

  // Error State
  errorTitle: {
    ...typography.subheading,
    color: palette.error,
    marginBottom: 8,
  },
  errorMessage: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.subheading,
    color: palette.background,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  emptyMessage: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
  },
});
