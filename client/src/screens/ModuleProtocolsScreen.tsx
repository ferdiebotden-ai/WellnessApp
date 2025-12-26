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
import { ProtocolBrowseCard } from '../components/protocol/ProtocolBrowseCard';
import { haptic } from '../utils/haptics';
import type { ProtocolsStackParamList } from '../navigation/ProtocolsStack';

type ModuleProtocolsScreenProps = NativeStackScreenProps<
  ProtocolsStackParamList,
  'ModuleProtocols'
>;

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
  const [selectedSegment, setSelectedSegment] = useState<'recommended' | 'all'>('recommended');

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

  // Determine which protocols to display based on segment
  const displayedProtocols = selectedSegment === 'recommended'
    ? starterProtocols
    : protocols; // 'all' shows everything

  const hasRecommended = starterProtocols.length > 0;

  const handleSegmentChange = useCallback((segment: 'recommended' | 'all') => {
    void haptic.light();
    setSelectedSegment(segment);
  }, []);

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

      {/* Segmented Control */}
      {hasRecommended && (
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segment,
              selectedSegment === 'recommended' && styles.segmentActive,
            ]}
            onPress={() => handleSegmentChange('recommended')}
          >
            <Ionicons
              name="star"
              size={14}
              color={selectedSegment === 'recommended' ? palette.background : palette.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                selectedSegment === 'recommended' && styles.segmentTextActive,
              ]}
            >
              Recommended
            </Text>
            <View style={[
              styles.countBadge,
              selectedSegment === 'recommended' && styles.countBadgeActive,
            ]}>
              <Text style={[
                styles.countText,
                selectedSegment === 'recommended' && styles.countTextActive,
              ]}>
                {starterProtocols.length}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[
              styles.segment,
              selectedSegment === 'all' && styles.segmentActive,
            ]}
            onPress={() => handleSegmentChange('all')}
          >
            <Ionicons
              name="list"
              size={14}
              color={selectedSegment === 'all' ? palette.background : palette.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                selectedSegment === 'all' && styles.segmentTextActive,
              ]}
            >
              All
            </Text>
            <View style={[
              styles.countBadge,
              selectedSegment === 'all' && styles.countBadgeActive,
            ]}>
              <Text style={[
                styles.countText,
                selectedSegment === 'all' && styles.countTextActive,
              ]}>
                {protocols.length}
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedSegment === 'recommended' ? 'Recommended Protocols' : 'All Protocols'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {selectedSegment === 'recommended'
            ? 'Start with these for best results'
            : 'Browse all available protocols'
          }
        </Text>
      </View>

      {/* Protocol List */}
      <View style={styles.protocolList}>
        {displayedProtocols.map((protocol) => (
          <ProtocolBrowseCard
            key={protocol.id}
            protocol={protocol}
            isEnrolled={enrolledIds.has(protocol.id)}
            isUpdating={updatingProtocolId === protocol.id}
            onToggle={handleToggleEnrollment}
            onPress={() => handleProtocolPress(protocol)}
          />
        ))}
      </View>

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

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  segmentActive: {
    backgroundColor: palette.primary,
  },
  segmentText: {
    ...typography.caption,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: palette.background,
  },
  countBadge: {
    backgroundColor: palette.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    ...typography.caption,
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  countTextActive: {
    color: palette.background,
  },

  // Section
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
