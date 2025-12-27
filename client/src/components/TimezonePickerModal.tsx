import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { tokens } from '../theme/tokens';

interface TimezonePickerModalProps {
  visible: boolean;
  currentTimezone: string;
  detectedTimezone: string;
  onSelect: (timezone: string) => void;
  onClose: () => void;
}

interface TimezoneOption {
  id: string;
  city: string;
  region: string;
  utcOffset: string;
  searchText: string;
}

/**
 * Get UTC offset string for a timezone
 */
function getUtcOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    return offsetPart?.value ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Extract city name from IANA timezone ID
 * "America/New_York" -> "New York"
 * "America/Indiana/Indianapolis" -> "Indianapolis"
 */
function extractCityName(timezoneId: string): string {
  const parts = timezoneId.split('/');
  const cityPart = parts[parts.length - 1];
  return cityPart.replace(/_/g, ' ');
}

/**
 * Extract region from IANA timezone ID
 * "America/New_York" -> "America"
 */
function extractRegion(timezoneId: string): string {
  const parts = timezoneId.split('/');
  return parts[0];
}

/**
 * Get all available timezones with metadata
 */
function getTimezoneOptions(): TimezoneOption[] {
  try {
    // Use Intl API to get supported timezones
    const timezones = Intl.supportedValuesOf('timeZone');

    return timezones
      .filter((tz) => {
        // Filter out non-geographic timezones
        return !tz.startsWith('Etc/') &&
               !tz.startsWith('SystemV/') &&
               tz.includes('/');
      })
      .map((tz) => {
        const city = extractCityName(tz);
        const region = extractRegion(tz);
        const utcOffset = getUtcOffset(tz);

        return {
          id: tz,
          city,
          region,
          utcOffset,
          // Searchable text includes city, region, and full ID
          searchText: `${city} ${region} ${tz}`.toLowerCase(),
        };
      })
      .sort((a, b) => {
        // Sort by city name
        return a.city.localeCompare(b.city);
      });
  } catch {
    // Fallback for older environments
    return FALLBACK_TIMEZONES.map((tz) => ({
      id: tz,
      city: extractCityName(tz),
      region: extractRegion(tz),
      utcOffset: getUtcOffset(tz),
      searchText: `${extractCityName(tz)} ${extractRegion(tz)} ${tz}`.toLowerCase(),
    }));
  }
}

// Fallback list of common timezones for older environments
const FALLBACK_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Mumbai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
];

export const TimezonePickerModal: React.FC<TimezonePickerModalProps> = ({
  visible,
  currentTimezone,
  detectedTimezone,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all timezone options
  const allTimezones = useMemo(() => getTimezoneOptions(), []);

  // Filter timezones based on search query
  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTimezones;
    }
    const query = searchQuery.toLowerCase().trim();
    return allTimezones.filter((tz) => tz.searchText.includes(query));
  }, [allTimezones, searchQuery]);

  // Handle timezone selection
  const handleSelect = useCallback(
    (timezone: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(timezone);
      setSearchQuery('');
      onClose();
    },
    [onSelect, onClose]
  );

  // Handle using auto-detected timezone
  const handleUseDetected = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(detectedTimezone);
    setSearchQuery('');
    onClose();
  }, [detectedTimezone, onSelect, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  // Render timezone item
  const renderTimezoneItem = useCallback(
    ({ item }: { item: TimezoneOption }) => {
      const isSelected = item.id === currentTimezone;

      return (
        <Pressable
          style={[styles.timezoneItem, isSelected && styles.timezoneItemSelected]}
          onPress={() => handleSelect(item.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          <View style={styles.timezoneInfo}>
            <Text style={[styles.timezoneCity, isSelected && styles.timezoneCitySelected]}>
              {item.city}
            </Text>
            <Text style={styles.timezoneRegion}>
              {item.region} · {item.utcOffset}
            </Text>
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </Pressable>
      );
    },
    [currentTimezone, handleSelect]
  );

  // Key extractor
  const keyExtractor = useCallback((item: TimezoneOption) => item.id, []);

  // Get detected timezone display info
  const detectedInfo = useMemo(() => {
    const city = extractCityName(detectedTimezone);
    const offset = getUtcOffset(detectedTimezone);
    return `${city} (${offset})`;
  }, [detectedTimezone]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Timezone</Text>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by city name..."
              placeholderTextColor={palette.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Auto-detected option */}
          {currentTimezone !== detectedTimezone && (
            <Pressable
              style={styles.autoDetectedButton}
              onPress={handleUseDetected}
              accessibilityRole="button"
            >
              <View style={styles.autoDetectedContent}>
                <Text style={styles.autoDetectedLabel}>Use auto-detected</Text>
                <Text style={styles.autoDetectedValue}>{detectedInfo}</Text>
              </View>
              <Text style={styles.autoDetectedIcon}>↺</Text>
            </Pressable>
          )}

          {/* Timezone List */}
          <FlatList
            data={filteredTimezones}
            renderItem={renderTimezoneItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No timezones found for "{searchQuery}"
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    maxHeight: '85%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    ...typography.h3,
    color: palette.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 18,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInput: {
    backgroundColor: palette.elevated,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typography.body,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  autoDetectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(99, 230, 190, 0.08)',
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  autoDetectedContent: {
    flex: 1,
  },
  autoDetectedLabel: {
    ...typography.caption,
    color: palette.primary,
    marginBottom: 2,
  },
  autoDetectedValue: {
    ...typography.body,
    color: palette.textPrimary,
  },
  autoDetectedIcon: {
    fontSize: 20,
    color: palette.primary,
    marginLeft: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  timezoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: tokens.radius.md,
    marginBottom: 4,
    backgroundColor: palette.elevated,
  },
  timezoneItemSelected: {
    backgroundColor: 'rgba(99, 230, 190, 0.12)',
    borderWidth: 1,
    borderColor: palette.primary,
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneCity: {
    ...typography.body,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  timezoneCitySelected: {
    color: palette.primary,
    fontWeight: '600',
  },
  timezoneRegion: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: palette.background,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: palette.textMuted,
    textAlign: 'center',
  },
});
