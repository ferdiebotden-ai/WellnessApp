/**
 * ModuleProtocolsScreen
 *
 * Shows all protocols for a specific module (focus area).
 * Users can:
 * - View starter protocols (recommended) and all protocols
 * - Enroll/unenroll from individual protocols
 * - Set this module as their primary focus
 * - Navigate to protocol details
 *
 * Session 83: Protocol Selection UX Overhaul
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { tokens } from '../theme/tokens';
import {
  fetchModuleProtocols,
  enrollInProtocol,
  unenrollFromProtocol,
  fetchEnrolledProtocols,
  type ModuleProtocol,
} from '../services/api';
import { useModules } from '../hooks/useModules';
import { ApexLoadingIndicator } from '../components/ui/ApexLoadingIndicator';
import { haptic } from '../utils/haptics';
import type { ProtocolsStackParamList } from '../navigation/ProtocolsStack';

type ModuleProtocolsScreenProps = NativeStackScreenProps<
  ProtocolsStackParamList,
  'ModuleProtocols'
>;

interface ProtocolCardProps {
  protocol: ModuleProtocol;
  isEnrolled: boolean;
  isUpdating: boolean;
  onToggle: (protocolId: string, enroll: boolean) => void;
  onPress: () => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({
  protocol,
  isEnrolled,
  isUpdating,
  onToggle,
  onPress,
}) => {
  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case 'Foundation':
        return 'sunny-outline';
      case 'Performance':
        return 'flash-outline';
      case 'Recovery':
        return 'moon-outline';
      case 'Optimization':
        return 'trending-up-outline';
      case 'Meta':
        return 'bulb-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes?.toString().padStart(2, '0') ?? '00'} ${ampm}`;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.protocolCard,
        isEnrolled && styles.protocolCardEnrolled,
        pressed && styles.protocolCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${protocol.name}${isEnrolled ? ', enrolled' : ''}`}
      accessibilityHint="Tap to view details"
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getCategoryIcon(protocol.category)}
              size={20}
              color={isEnrolled ? palette.primary : palette.textMuted}
            />
          </View>
          <View style={styles.cardTitleSection}>
            <Text
              style={[styles.protocolName, isEnrolled && styles.protocolNameEnrolled]}
              numberOfLines={1}
            >
              {protocol.short_name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.timeText}>{formatTime(protocol.default_time)}</Text>
              <Text style={styles.categoryText}>{protocol.category}</Text>
              {protocol.duration_minutes && (
                <Text style={styles.durationText}>{protocol.duration_minutes}m</Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.protocolSummary} numberOfLines={2}>
          {protocol.summary}
        </Text>

        {/* Starter Badge */}
        {protocol.is_starter_protocol && (
          <View style={styles.starterBadge}>
            <Text style={styles.starterBadgeText}>RECOMMENDED</Text>
          </View>
        )}
      </View>

      <View style={styles.enrollSection}>
        {isUpdating ? (
          <ActivityIndicator size="small" color={palette.primary} />
        ) : (
          <Switch
            value={isEnrolled}
            onValueChange={(value) => onToggle(protocol.id, value)}
            trackColor={{ false: palette.surface, true: `${palette.primary}40` }}
            thumbColor={isEnrolled ? palette.primary : palette.textMuted}
            ios_backgroundColor={palette.surface}
          />
        )}
      </View>
    </Pressable>
  );
};

export const ModuleProtocolsScreen: React.FC<ModuleProtocolsScreenProps> = ({
  navigation,
  route,
}) => {
  const { moduleId, moduleName } = route.params;

  const [protocols, setProtocols] = useState<ModuleProtocol[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingProtocolId, setUpdatingProtocolId] = useState<string | null>(null);

  const { primaryModuleId, selectPrimaryModule, isUpdating: isPrimaryUpdating } = useModules();
  const isPrimary = primaryModuleId === moduleId;

  // Load protocols and enrollment status
  const loadData = useCallback(async () => {
    try {
      const [moduleProtocols, enrolled] = await Promise.all([
        fetchModuleProtocols(moduleId),
        fetchEnrolledProtocols(),
      ]);

      setProtocols(moduleProtocols);
      setEnrolledIds(new Set(enrolled.map((e) => e.protocol_id)));
    } catch (error) {
      console.error('Failed to load module protocols:', error);
      Alert.alert('Error', 'Failed to load protocols. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moduleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleToggleEnrollment = useCallback(
    async (protocolId: string, enroll: boolean) => {
      setUpdatingProtocolId(protocolId);
      void haptic.light();

      try {
        if (enroll) {
          const protocol = protocols.find((p) => p.id === protocolId);
          await enrollInProtocol(protocolId, {
            moduleId,
            time: protocol?.default_time,
          });
          setEnrolledIds((prev) => new Set([...prev, protocolId]));
        } else {
          await unenrollFromProtocol(protocolId);
          setEnrolledIds((prev) => {
            const next = new Set(prev);
            next.delete(protocolId);
            return next;
          });
        }
        void haptic.success();
      } catch (error) {
        console.error('Failed to update enrollment:', error);
        Alert.alert('Error', 'Failed to update enrollment. Please try again.');
        void haptic.error();
      } finally {
        setUpdatingProtocolId(null);
      }
    },
    [moduleId, protocols]
  );

  const handleProtocolPress = useCallback(
    (protocol: ModuleProtocol) => {
      navigation.navigate('ProtocolDetail', {
        protocolId: protocol.id,
        protocolName: protocol.name,
        moduleId,
        source: 'browse',
      });
    },
    [navigation, moduleId]
  );

  const handleSetPrimary = useCallback(async () => {
    if (isPrimary) return;

    void haptic.medium();
    const success = await selectPrimaryModule(moduleId);
    if (success) {
      void haptic.success();
    } else {
      Alert.alert('Error', 'Failed to set as primary focus. Please try again.');
      void haptic.error();
    }
  }, [isPrimary, moduleId, selectPrimaryModule]);

  // Split protocols into starter and others
  const starterProtocols = protocols.filter((p) => p.is_starter_protocol);
  const otherProtocols = protocols.filter((p) => !p.is_starter_protocol);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ApexLoadingIndicator size={48} />
        <Text style={styles.loadingText}>Loading protocols...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={palette.primary}
        />
      }
    >
      {/* Module Header */}
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleName}>{moduleName}</Text>

        {/* Set as Primary Toggle */}
        <Pressable
          style={[styles.primaryToggle, isPrimary && styles.primaryToggleActive]}
          onPress={handleSetPrimary}
          disabled={isPrimary || isPrimaryUpdating}
        >
          {isPrimaryUpdating ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <>
              <Ionicons
                name={isPrimary ? 'checkmark-circle' : 'flag-outline'}
                size={18}
                color={isPrimary ? palette.success : palette.textSecondary}
              />
              <Text
                style={[styles.primaryToggleText, isPrimary && styles.primaryToggleTextActive]}
              >
                {isPrimary ? 'Your Primary Focus' : 'Set as Primary'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Starter Protocols Section */}
      {starterProtocols.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Protocols</Text>
            <Text style={styles.sectionSubtitle}>
              Start with these for best results
            </Text>
          </View>
          <View style={styles.protocolList}>
            {starterProtocols.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                isEnrolled={enrolledIds.has(protocol.id)}
                isUpdating={updatingProtocolId === protocol.id}
                onToggle={handleToggleEnrollment}
                onPress={() => handleProtocolPress(protocol)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Other Protocols Section */}
      {otherProtocols.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Protocols</Text>
            <Text style={styles.sectionSubtitle}>
              Browse all available protocols
            </Text>
          </View>
          <View style={styles.protocolList}>
            {otherProtocols.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                isEnrolled={enrolledIds.has(protocol.id)}
                isUpdating={updatingProtocolId === protocol.id}
                onToggle={handleToggleEnrollment}
                onPress={() => handleProtocolPress(protocol)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {protocols.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color={palette.textMuted} />
          <Text style={styles.emptyTitle}>No Protocols Available</Text>
          <Text style={styles.emptyMessage}>
            Protocols for this module are coming soon.
          </Text>
        </View>
      )}

      {/* Enrollment Summary */}
      {enrolledIds.size > 0 && (
        <View style={styles.summaryCard}>
          <Ionicons name="checkmark-circle" size={20} color={palette.success} />
          <Text style={styles.summaryText}>
            {enrolledIds.size} protocol{enrolledIds.size > 1 ? 's' : ''} enrolled
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  loadingText: {
    marginTop: 16,
    ...typography.body,
    color: palette.textSecondary,
  },

  // Module Header
  moduleHeader: {
    marginBottom: 24,
  },
  moduleName: {
    ...typography.heading,
    color: palette.textPrimary,
    marginBottom: 12,
  },
  primaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    alignSelf: 'flex-start',
    gap: 8,
  },
  primaryToggleActive: {
    backgroundColor: palette.successMuted,
    borderColor: palette.success,
  },
  primaryToggleText: {
    ...typography.caption,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  primaryToggleTextActive: {
    color: palette.success,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: palette.textMuted,
  },
  protocolList: {
    gap: 12,
  },

  // Protocol Card
  protocolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  protocolCardEnrolled: {
    borderColor: palette.primary,
    backgroundColor: `${palette.primary}08`,
  },
  protocolCardPressed: {
    backgroundColor: palette.elevated,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleSection: {
    flex: 1,
  },
  protocolName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 2,
  },
  protocolNameEnrolled: {
    color: palette.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 12,
    color: palette.textMuted,
  },
  durationText: {
    fontSize: 12,
    color: palette.textMuted,
  },
  protocolSummary: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  starterBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: `${palette.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  starterBadgeText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  enrollSection: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  emptyMessage: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
  },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.successMuted,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: tokens.radius.md,
    gap: 8,
    marginTop: 16,
  },
  summaryText: {
    ...typography.body,
    color: palette.success,
    fontWeight: '600',
  },
});
