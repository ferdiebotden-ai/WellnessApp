import React, { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useModules } from '../hooks/useModules';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { ApexLoadingIndicator } from '../components/ui/ApexLoadingIndicator';
import type { ModuleSummary } from '../types/module';

interface ModuleCardProps {
  module: ModuleSummary;
  isPrimary: boolean;
  isUpdating: boolean;
  onSelect: (moduleId: string) => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isPrimary,
  isUpdating,
  onSelect,
}) => {
  const handlePress = useCallback(() => {
    if (!isPrimary && !isUpdating) {
      onSelect(module.id);
    }
  }, [module.id, isPrimary, isUpdating, onSelect]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.moduleCard,
        isPrimary && styles.moduleCardPrimary,
        pressed && !isPrimary && styles.moduleCardPressed,
      ]}
      onPress={handlePress}
      disabled={isUpdating}
      accessibilityRole="button"
      accessibilityState={{ selected: isPrimary, disabled: isUpdating }}
      accessibilityLabel={`${module.name}${isPrimary ? ', currently active' : ''}`}
      testID={`module-card-${module.id}`}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>ACTIVE FOCUS</Text>
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
      <Text style={styles.moduleDescription}>{module.description}</Text>

      {/* Action Indicator */}
      {!isPrimary && (
        <View style={styles.selectPrompt}>
          <Text style={styles.selectPromptText}>Tap to set as primary</Text>
        </View>
      )}

      {/* Loading Overlay */}
      {isUpdating && (
        <View style={styles.updatingOverlay}>
          <ApexLoadingIndicator size={24} />
        </View>
      )}
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

export const ProtocolsScreen: React.FC = () => {
  const {
    modules,
    primaryModuleId,
    status,
    error,
    isUpdating,
    selectPrimaryModule,
    reload,
  } = useModules();

  const handleSelectModule = useCallback(
    async (moduleId: string) => {
      const success = await selectPrimaryModule(moduleId);
      if (!success) {
        Alert.alert(
          'Update Failed',
          'Could not switch your primary module. Please try again.',
          [{ text: 'OK' }]
        );
      }
    },
    [selectPrimaryModule]
  );

  // Loading State
  if (status === 'loading') {
    return (
      <View style={styles.centerContainer} testID="protocols-loading">
        <ApexLoadingIndicator size={48} />
        <Text style={styles.loadingText}>Loading modules...</Text>
      </View>
    );
  }

  // Error State
  if (status === 'error') {
    return (
      <View style={styles.centerContainer} testID="protocols-error">
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
      testID="protocols-screen"
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.heading}>Modules</Text>
        <Text style={styles.subtitle}>
          Select your primary wellness focus. Your daily protocols and AI coaching
          will be tailored to this module.
        </Text>
      </View>

      {/* Current Focus Card */}
      {primaryModuleId && (
        <View style={styles.focusCard}>
          <Text style={styles.focusLabel}>CURRENT FOCUS</Text>
          <Text style={styles.focusModule}>
            {modules.find((m) => m.id === primaryModuleId)?.name ?? 'None'}
          </Text>
        </View>
      )}

      {/* Module Grid */}
      <View style={styles.moduleGrid}>
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            isPrimary={module.id === primaryModuleId}
            isUpdating={isUpdating}
            onSelect={handleSelectModule}
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

      {/* Footer Info */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>
          Your module selection drives personalized protocol recommendations and
          daily action items. Switch modules anytime to shift your focus.
        </Text>
      </View>
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

  // Focus Card
  focusCard: {
    backgroundColor: palette.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.primary,
    padding: 16,
    marginBottom: 24,
  },
  focusLabel: {
    ...typography.caption,
    color: palette.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  focusModule: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontSize: 18,
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

  // Select Prompt
  selectPrompt: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  selectPromptText: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
  },

  // Updating Overlay
  updatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 18, 24, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
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

  // Footer
  footerInfo: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  footerText: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
