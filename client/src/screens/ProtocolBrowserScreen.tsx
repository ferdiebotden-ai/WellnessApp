/**
 * ProtocolBrowserScreen
 *
 * Browse and add protocols to daily schedule.
 * Features:
 * - Search bar with semantic search
 * - Protocol cards grouped by category
 * - Tap to toggle enrollment with toast feedback
 * - Shows enrolled badge on enrolled protocols
 *
 * Session 61: Protocol Scheduling & Duration Tracking
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApexLoadingIndicator } from '../components/ui/ApexLoadingIndicator';
import { useNavigation } from '@react-navigation/native';
import {
  searchProtocols,
  fetchEnrolledProtocols,
  enrollInProtocol,
  unenrollFromProtocol,
  type ProtocolSearchResult,
  type EnrolledProtocol,
} from '../services/api';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { TimePickerBottomSheet } from '../components/protocol/TimePickerBottomSheet';

type Status = 'idle' | 'loading' | 'searching' | 'success' | 'error';

// Default protocols to show when no search query
const DEFAULT_SEARCH_QUERIES = [
  'morning light exposure',
  'cold exposure',
  'breathing exercises',
  'sleep optimization',
];

/**
 * Determine suggested time based on protocol characteristics.
 * Mirrors backend logic in protocolEnrollment.ts
 */
function getSuggestedTime(protocolId: string, category: string | null): string {
  const id = protocolId.toLowerCase();

  // Morning protocols
  if (
    id.includes('morning_light') ||
    id.includes('foundation') ||
    id.includes('sunlight') ||
    id.includes('wake')
  ) {
    return '07:00';
  }

  // Mid-morning exercise/cold
  if (
    id.includes('exercise') ||
    id.includes('cold_exposure') ||
    id.includes('cold_shower') ||
    id.includes('workout')
  ) {
    return '10:00';
  }

  // Midday/afternoon focus
  if (
    id.includes('breathwork') ||
    id.includes('meditation') ||
    id.includes('nsdr') ||
    id.includes('yoga_nidra') ||
    id.includes('cyclic_sigh')
  ) {
    return '13:00';
  }

  // Evening wind-down
  if (
    id.includes('wind_down') ||
    id.includes('sleep') ||
    id.includes('evening') ||
    id.includes('magnesium') ||
    id.includes('blue_light')
  ) {
    return '21:00';
  }

  // Category-based fallback
  if (category === 'Foundation') {
    return '07:00';
  }
  if (category === 'Recovery') {
    return '21:00';
  }

  // Default midday
  return '12:00';
}

interface ProtocolCardProps {
  protocol: ProtocolSearchResult;
  isEnrolled: boolean;
  isUpdating: boolean;
  onToggle: () => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({
  protocol,
  isEnrolled,
  isUpdating,
  onToggle,
}) => {
  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'Foundation':
        return palette.primary;
      case 'Performance':
        return palette.secondary;
      case 'Recovery':
        return palette.success;
      case 'Optimization':
        return palette.accent;
      default:
        return palette.textMuted;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.protocolCard,
        isEnrolled && styles.protocolCardEnrolled,
        pressed && styles.protocolCardPressed,
      ]}
      onPress={onToggle}
      disabled={isUpdating}
      accessibilityRole="button"
      accessibilityState={{ selected: isEnrolled, disabled: isUpdating }}
      accessibilityLabel={`${protocol.name}${isEnrolled ? ', enrolled' : ''}`}
      testID={`protocol-card-${protocol.id}`}
    >
      {/* Enrolled Badge */}
      {isEnrolled && (
        <View style={styles.enrolledBadge}>
          <Ionicons name="checkmark-circle" size={14} color={palette.background} />
          <Text style={styles.enrolledBadgeText}>SCHEDULED</Text>
        </View>
      )}

      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text
            style={[styles.protocolName, isEnrolled && styles.protocolNameEnrolled]}
            numberOfLines={1}
          >
            {protocol.name}
          </Text>
        </View>
        {protocol.category && (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: `${getCategoryColor(protocol.category)}20` },
            ]}
          >
            <Text
              style={[styles.categoryText, { color: getCategoryColor(protocol.category) }]}
            >
              {protocol.category}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.protocolDescription} numberOfLines={2}>
        {protocol.description || 'No description available'}
      </Text>

      {/* Footer with action hint */}
      <View style={styles.cardFooter}>
        <Text style={styles.actionHint}>
          {isEnrolled ? 'Tap to remove from schedule' : 'Tap to add to schedule'}
        </Text>
        {protocol.score > 0 && (
          <Text style={styles.scoreText}>{Math.round(protocol.score * 100)}% match</Text>
        )}
      </View>

      {/* Loading Overlay */}
      {isUpdating && (
        <View style={styles.updatingOverlay}>
          <ApexLoadingIndicator size={24} />
        </View>
      )}
    </Pressable>
  );
};

export const ProtocolBrowserScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [protocols, setProtocols] = useState<ProtocolSearchResult[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('idle');
  const [updatingProtocolId, setUpdatingProtocolId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });
  const [timePickerProtocol, setTimePickerProtocol] = useState<ProtocolSearchResult | null>(null);

  // Load enrolled protocols on mount
  useEffect(() => {
    const loadEnrolled = async () => {
      const enrolled = await fetchEnrolledProtocols();
      setEnrolledIds(new Set(enrolled.map((e) => e.protocol_id)));
    };
    void loadEnrolled();
  }, []);

  // Load default protocols on mount
  useEffect(() => {
    const loadDefaults = async () => {
      setStatus('loading');
      try {
        // Fetch from multiple categories in parallel
        const results = await Promise.all(
          DEFAULT_SEARCH_QUERIES.map((q) => searchProtocols(q, 4))
        );

        // Flatten and deduplicate by ID
        const seen = new Set<string>();
        const allProtocols: ProtocolSearchResult[] = [];
        for (const batch of results) {
          for (const p of batch) {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              allProtocols.push(p);
            }
          }
        }

        setProtocols(allProtocols);
        setStatus('success');
      } catch (error) {
        console.error('[ProtocolBrowserScreen] Failed to load defaults:', error);
        setStatus('error');
      }
    };
    void loadDefaults();
  }, []);

  // Search handler with debounce
  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      return; // Wait for at least 2 characters
    }

    setStatus('searching');
    try {
      const results = await searchProtocols(query.trim(), 15);
      setProtocols(results);
      setStatus('success');
    } catch (error) {
      console.error('[ProtocolBrowserScreen] Search failed:', error);
      setStatus('error');
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      void handleSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Show toast helper
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  }, []);

  // Handle card tap - either unenroll or show time picker
  const handleCardTap = useCallback(
    (protocol: ProtocolSearchResult) => {
      const isCurrentlyEnrolled = enrolledIds.has(protocol.id);

      if (isCurrentlyEnrolled) {
        // Unenroll immediately
        void handleUnenroll(protocol);
      } else {
        // Show time picker for new enrollment
        setTimePickerProtocol(protocol);
      }
    },
    [enrolledIds]
  );

  // Unenroll handler
  const handleUnenroll = useCallback(
    async (protocol: ProtocolSearchResult) => {
      setUpdatingProtocolId(protocol.id);
      try {
        await unenrollFromProtocol(protocol.id);
        setEnrolledIds((prev) => {
          const next = new Set(prev);
          next.delete(protocol.id);
          return next;
        });
        showToast(`${protocol.name} removed from schedule`);
      } catch (error) {
        console.error('[ProtocolBrowserScreen] Unenroll failed:', error);
        showToast('Failed to remove. Please try again.');
      } finally {
        setUpdatingProtocolId(null);
      }
    },
    [showToast]
  );

  // Enroll with selected time
  const handleEnrollWithTime = useCallback(
    async (time: string) => {
      if (!timePickerProtocol) return;

      const protocol = timePickerProtocol;
      setTimePickerProtocol(null); // Close modal
      setUpdatingProtocolId(protocol.id);

      try {
        const response = await enrollInProtocol(protocol.id, { time });
        setEnrolledIds((prev) => new Set([...prev, protocol.id]));

        // Format time for display (HH:MM → h:mm AM/PM)
        const [hours, mins] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayTime = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;

        showToast(`${protocol.name} scheduled at ${displayTime}`);
      } catch (error) {
        console.error('[ProtocolBrowserScreen] Enroll failed:', error);
        showToast('Failed to add. Please try again.');
      } finally {
        setUpdatingProtocolId(null);
      }
    },
    [timePickerProtocol, showToast]
  );

  // Group protocols by category
  const groupedProtocols = useMemo(() => {
    const groups: Record<string, ProtocolSearchResult[]> = {};
    for (const protocol of protocols) {
      const category = protocol.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(protocol);
    }
    return groups;
  }, [protocols]);

  const categoryOrder = ['Foundation', 'Performance', 'Recovery', 'Optimization', 'Other'];
  const sortedCategories = Object.keys(groupedProtocols).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="back-button"
        >
          <Ionicons name="chevron-back" size={24} color={palette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Protocols</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={palette.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search protocols..."
            placeholderTextColor={palette.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            testID="search-input"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} testID="clear-search">
              <Ionicons name="close-circle" size={20} color={palette.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Loading State */}
      {(status === 'loading' || status === 'searching') && (
        <View style={styles.loadingContainer}>
          <ApexLoadingIndicator size={48} />
          <Text style={styles.loadingText}>
            {status === 'searching' ? 'Searching...' : 'Loading protocols...'}
          </Text>
        </View>
      )}

      {/* Error State */}
      {status === 'error' && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Unable to Load Protocols</Text>
          <Text style={styles.emptySubtitle}>Please try again later.</Text>
        </View>
      )}

      {/* Protocol List */}
      {status === 'success' && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="protocol-list"
        >
          {sortedCategories.map((category) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryHeader}>{category}</Text>
              {groupedProtocols[category].map((protocol) => (
                <ProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  isEnrolled={enrolledIds.has(protocol.id)}
                  isUpdating={updatingProtocolId === protocol.id}
                  onToggle={() => handleCardTap(protocol)}
                />
              ))}
            </View>
          ))}

          {/* Empty Search State */}
          {protocols.length === 0 && searchQuery.length >= 2 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No protocols found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term or browse categories.
              </Text>
            </View>
          )}

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              Added protocols will appear in your daily schedule with smart default times.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <View style={styles.toast} testID="toast">
          <Ionicons
            name={toast.message.includes('removed') ? 'close-circle' : 'checkmark-circle'}
            size={20}
            color={palette.textPrimary}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Time Picker Modal */}
      <TimePickerBottomSheet
        visible={timePickerProtocol !== null}
        onClose={() => setTimePickerProtocol(null)}
        onConfirm={handleEnrollWithTime}
        protocolName={timePickerProtocol?.name || ''}
        suggestedTime={
          timePickerProtocol
            ? getSuggestedTime(timePickerProtocol.id, timePickerProtocol.category)
            : '12:00'
        }
        category={timePickerProtocol?.category}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading,
    color: palette.textPrimary,
    fontSize: 20,
  },
  headerSpacer: {
    width: 40,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: palette.textPrimary,
    padding: 0,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    ...typography.body,
    color: palette.textSecondary,
    marginTop: 12,
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Category Section
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    ...typography.subheading,
    color: palette.textSecondary,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Protocol Card
  protocolCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    position: 'relative',
    overflow: 'hidden',
  },
  protocolCardEnrolled: {
    borderColor: palette.primary,
    borderWidth: 2,
    backgroundColor: palette.elevated,
  },
  protocolCardPressed: {
    backgroundColor: palette.elevated,
    transform: [{ scale: 0.98 }],
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 90,
  },
  cardTitleRow: {
    flex: 1,
  },
  protocolName: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontSize: 17,
  },
  protocolNameEnrolled: {
    color: palette.primary,
  },

  // Category Badge
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: '600',
  },

  // Enrolled Badge
  enrolledBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: palette.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enrolledBadgeText: {
    ...typography.caption,
    color: palette.background,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // Description
  protocolDescription: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  actionHint: {
    ...typography.caption,
    color: palette.textMuted,
  },
  scoreText: {
    ...typography.caption,
    color: palette.textMuted,
    fontFamily: 'monospace',
  },

  // Updating Overlay
  updatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 18, 24, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
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

  // Toast
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: palette.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    ...typography.body,
    color: palette.textPrimary,
    flex: 1,
  },
});
