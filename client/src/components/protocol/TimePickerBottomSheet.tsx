/**
 * TimePickerBottomSheet
 *
 * Modal for selecting a custom time when enrolling in a protocol.
 * Shows suggested time with option to customize.
 * Uses React Native's built-in Modal for simplicity.
 *
 * Session 63: Push Notifications & Schedule Reminders
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (time: string) => void; // Time in "HH:MM" format
  protocolName: string;
  suggestedTime: string; // Default time in "HH:MM" format
  category?: string | null;
}

/**
 * Convert "HH:MM" string to Date object (uses today's date)
 */
function timeStringToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Convert Date back to "HH:MM" 24-hour format string
 */
function dateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format time from "HH:MM" to "h:mm AM/PM"
 */
function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get contextual hint based on protocol category
 */
function getCategoryHint(category: string | null | undefined): string | null {
  switch (category) {
    case 'Foundation':
      return 'Foundation protocols work best in the morning, within 60 min of waking';
    case 'Recovery':
      return 'Recovery protocols are optimal in the evening, before sleep';
    case 'Performance':
      return 'Performance protocols are flexible; schedule when you have focus time';
    case 'Optimization':
      return 'Optimize timing based on your daily routine';
    default:
      return null;
  }
}

export const TimePickerBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  onConfirm,
  protocolName,
  suggestedTime,
  category,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    timeStringToDate(suggestedTime)
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedDate(timeStringToDate(suggestedTime));
    }
  }, [visible, suggestedTime]);

  const categoryHint = useMemo(() => getCategoryHint(category), [category]);

  // Current selected time as string for display
  const selectedTimeString = dateToTimeString(selectedDate);

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedTimeString);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheet}>
              {/* Handle */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
                  Schedule {protocolName}
                </Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={palette.textSecondary} />
                </Pressable>
              </View>

              {/* Category Hint */}
              {categoryHint && (
                <View style={styles.hintContainer}>
                  <Ionicons name="information-circle" size={16} color={palette.primary} />
                  <Text style={styles.hintText}>{categoryHint}</Text>
                </View>
              )}

              {/* Suggested Time Quick-Select */}
              <View style={styles.suggestedSection}>
                <Text style={styles.suggestedLabel}>Suggested time:</Text>
                <Pressable
                  style={[
                    styles.suggestedButton,
                    selectedTimeString === suggestedTime &&
                      styles.suggestedButtonSelected,
                  ]}
                  onPress={() => setSelectedDate(timeStringToDate(suggestedTime))}
                >
                  <Ionicons
                    name={
                      selectedTimeString === suggestedTime
                        ? 'checkmark-circle'
                        : 'time-outline'
                    }
                    size={20}
                    color={
                      selectedTimeString === suggestedTime
                        ? palette.primary
                        : palette.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.suggestedButtonText,
                      selectedTimeString === suggestedTime &&
                        styles.suggestedButtonTextSelected,
                    ]}
                  >
                    {formatTimeDisplay(suggestedTime)}
                  </Text>
                </Pressable>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or pick a custom time</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Time Picker */}
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minuteInterval={15}
                  onChange={handleTimeChange}
                  themeVariant="dark"
                  style={styles.picker}
                />
              </View>

              {/* Confirm Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.confirmButtonPressed,
                ]}
                onPress={handleConfirm}
              >
                <Ionicons name="add-circle" size={20} color={palette.background} />
                <Text style={styles.confirmButtonText}>
                  Add at {formatTimeDisplay(selectedTimeString)}
                </Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: palette.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
    fontSize: 18,
    flex: 1,
    paddingRight: 12,
  },
  closeButton: {
    padding: 4,
  },

  // Hint
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${palette.primary}15`,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  hintText: {
    ...typography.caption,
    color: palette.primary,
    flex: 1,
    lineHeight: 18,
  },

  // Suggested
  suggestedSection: {
    marginBottom: 16,
  },
  suggestedLabel: {
    ...typography.caption,
    color: palette.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  suggestedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.elevated,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.border,
    gap: 10,
  },
  suggestedButtonSelected: {
    borderColor: palette.primary,
    backgroundColor: `${palette.primary}10`,
  },
  suggestedButtonText: {
    ...typography.subheading,
    color: palette.textSecondary,
    fontSize: 16,
  },
  suggestedButtonTextSelected: {
    color: palette.primary,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  dividerText: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Time Picker
  pickerContainer: {
    backgroundColor: palette.elevated,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.md,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && { height: 180 }),
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 180 : undefined,
  },

  // Confirm
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  confirmButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  confirmButtonText: {
    ...typography.subheading,
    color: palette.background,
    fontSize: 16,
  },
});
