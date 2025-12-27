/**
 * StarterProtocolSelectionScreen
 *
 * Shows starter protocols for the user's selected goals/modules.
 * User can toggle which protocols to add to their schedule.
 * Protocols are grouped by module when multiple goals are selected.
 *
 * Flow: GoalSelection → StarterProtocolSelection → BiometricProfile → ...
 *
 * Session 83: Multi-goal support
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { tokens } from '../../theme/tokens';
import {
  getModulesForGoals,
  getPrimaryModuleForGoals,
  type StarterProtocol,
} from '../../types/onboarding';
import { fetchStarterProtocols } from '../../services/api';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type StarterProtocolSelectionScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'StarterProtocolSelection'
>;

interface ProtocolCardProps {
  protocol: StarterProtocol;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({
  protocol,
  isSelected,
  onToggle,
}) => {
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'Foundation':
        return 'sunny-outline';
      case 'Performance':
        return 'flash-outline';
      case 'Recovery':
        return 'moon-outline';
      case 'Optimization':
        return 'trending-up-outline';
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
      style={[
        styles.protocolCard,
        isSelected && styles.protocolCardSelected,
      ]}
      onPress={() => onToggle(protocol.id)}
      accessibilityRole="switch"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${protocol.name}${isSelected ? ', selected' : ''}`}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getCategoryIcon(protocol.category) as keyof typeof Ionicons.glyphMap}
              size={20}
              color={isSelected ? palette.primary : palette.textMuted}
            />
          </View>
          <View style={styles.cardTitleSection}>
            <Text
              style={[
                styles.protocolName,
                isSelected && styles.protocolNameSelected,
              ]}
              numberOfLines={1}
            >
              {protocol.short_name || protocol.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.timeText}>{formatTime(protocol.default_time)}</Text>
              <Text style={styles.categoryText}>{protocol.category}</Text>
            </View>
          </View>
        </View>

        <Text
          style={styles.protocolSummary}
          numberOfLines={2}
        >
          {protocol.summary}
        </Text>
      </View>

      <Switch
        value={isSelected}
        onValueChange={() => onToggle(protocol.id)}
        trackColor={{ false: palette.surface, true: `${palette.primary}40` }}
        thumbColor={isSelected ? palette.primary : palette.textMuted}
        ios_backgroundColor={palette.surface}
      />
    </Pressable>
  );
};

// Module ID to display name mapping
const MODULE_DISPLAY_NAMES: Record<string, string> = {
  mod_sleep: 'Sleep Optimization',
  mod_morning_routine: 'Morning Routine',
  mod_focus_productivity: 'Focus & Productivity',
};

interface ProtocolSection {
  title: string;
  data: StarterProtocol[];
}

export const StarterProtocolSelectionScreen: React.FC<StarterProtocolSelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const { selectedGoals } = route.params;
  // Memoize moduleIds to prevent useEffect re-running on every render
  // (getModulesForGoals returns a new array reference each call)
  const moduleIds = useMemo(
    () => getModulesForGoals(selectedGoals),
    [selectedGoals]
  );

  const [sections, setSections] = useState<ProtocolSection[]>([]);
  const [selectedProtocolIds, setSelectedProtocolIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProtocols = async () => {
      try {
        // Fetch protocols for all modules in parallel
        const results = await Promise.all(
          moduleIds.map(async (moduleId) => {
            const protocols = await fetchStarterProtocols(moduleId);
            return { moduleId, protocols };
          })
        );

        // Build sections
        const newSections: ProtocolSection[] = results
          .filter((r) => r.protocols.length > 0)
          .map((r) => ({
            title: MODULE_DISPLAY_NAMES[r.moduleId] || r.moduleId,
            data: r.protocols,
          }));

        setSections(newSections);

        // Default: all protocols selected
        const allProtocolIds = results.flatMap((r) => r.protocols.map((p) => p.id));
        setSelectedProtocolIds(new Set(allProtocolIds));
      } catch (error) {
        console.error('Failed to load starter protocols:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProtocols();
  }, [moduleIds]);

  const handleToggleProtocol = useCallback((protocolId: string) => {
    setSelectedProtocolIds((prev) => {
      const next = new Set(prev);
      if (next.has(protocolId)) {
        next.delete(protocolId);
      } else {
        next.add(protocolId);
      }
      return next;
    });
  }, []);

  const handleContinue = useCallback(() => {
    navigation.navigate('BiometricProfile', {
      selectedGoals,
      selectedProtocolIds: Array.from(selectedProtocolIds),
    });
  }, [navigation, selectedGoals, selectedProtocolIds]);

  const selectedCount = selectedProtocolIds.size;
  const totalCount = sections.reduce((acc, s) => acc + s.data.length, 0);
  const showSectionHeaders = sections.length > 1;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Loading protocols...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.header}
          >
            <Text style={styles.title}>Recommended Protocols</Text>
            <Text style={styles.subtitle}>
              {selectedGoals.length > 1
                ? "Based on your goals, we've curated these protocols. Toggle off any you'd like to skip."
                : "These protocols are designed for your goal. Toggle off any you'd like to skip."}
            </Text>
          </Animated.View>
        }
        renderSectionHeader={({ section }) =>
          showSectionHeaders ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(500).delay(200 + index * 50)}
          >
            <ProtocolCard
              protocol={item}
              isSelected={selectedProtocolIds.has(item.id)}
              onToggle={handleToggleProtocol}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={palette.textMuted} />
            <Text style={styles.emptyTitle}>No Protocols Available</Text>
            <Text style={styles.emptyMessage}>
              We're still building protocols for these focus areas.
            </Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Text style={styles.selectionCount}>
          {selectedCount} of {totalCount} selected
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to next step"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={palette.background} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: palette.textMuted,
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  protocolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.elevated,
  },
  protocolCardSelected: {
    borderColor: palette.primary,
    backgroundColor: `${palette.primary}08`,
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
  protocolNameSelected: {
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
  protocolSummary: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  emptyMessage: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.elevated,
  },
  selectionCount: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    borderRadius: tokens.radius.lg,
    paddingVertical: 16,
    gap: 8,
  },
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.background,
  },
});
