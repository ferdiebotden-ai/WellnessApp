/**
 * TimePickerBottomSheet
 *
 * Modal for selecting a custom time when enrolling in a protocol.
 * Shows suggested time with option to customize.
 * Uses React Native's built-in Modal for simplicity.
 *
 * Session 63: Push Notifications & Schedule Reminders
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (time: string) => void; // Time in "HH:MM" format
  protocolName: string;
  suggestedTime: string; // Default time in "HH:MM" format
  category?: string | null;
}

// Common schedule times for quick selection
const QUICK_TIMES = [
  { label: '6:00 AM', value: '06:00', period: 'morning' },
  { label: '7:00 AM', value: '07:00', period: 'morning' },
  { label: '8:00 AM', value: '08:00', period: 'morning' },
  { label: '10:00 AM', value: '10:00', period: 'midday' },
  { label: '12:00 PM', value: '12:00', period: 'midday' },
  { label: '2:00 PM', value: '14:00', period: 'afternoon' },
  { label: '5:00 PM', value: '17:00', period: 'afternoon' },
  { label: '7:00 PM', value: '19:00', period: 'evening' },
  { label: '9:00 PM', value: '21:00', period: 'evening' },
];

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
  const [selectedTime, setSelectedTime] = useState(suggestedTime);

  // Reset selection when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedTime(suggestedTime);
    }
  }, [visible, suggestedTime]);

  const categoryHint = useMemo(() => getCategoryHint(category), [category]);

  const handleConfirm = () => {
    onConfirm(selectedTime);
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

              {/* Suggested Time */}
              <View style={styles.suggestedSection}>
                <Text style={styles.suggestedLabel}>Suggested time:</Text>
                <Pressable
                  style={[
                    styles.suggestedButton,
                    selectedTime === suggestedTime && styles.suggestedButtonSelected,
                  ]}
                  onPress={() => setSelectedTime(suggestedTime)}
                >
                  <Ionicons
                    name={selectedTime === suggestedTime ? 'checkmark-circle' : 'time-outline'}
                    size={20}
                    color={selectedTime === suggestedTime ? palette.primary : palette.textSecondary}
                  />
                  <Text
                    style={[
                      styles.suggestedButtonText,
                      selectedTime === suggestedTime && styles.suggestedButtonTextSelected,
                    ]}
                  >
                    {formatTimeDisplay(suggestedTime)}
                  </Text>
                </Pressable>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or choose a time</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Time Grid */}
              <ScrollView
                style={styles.timeGrid}
                contentContainerStyle={styles.timeGridContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.timeRow}>
                  {QUICK_TIMES.map((time) => (
                    <Pressable
                      key={time.value}
                      style={[
                        styles.timeButton,
                        selectedTime === time.value && styles.timeButtonSelected,
                      ]}
                      onPress={() => setSelectedTime(time.value)}
                    >
                      <Text
                        style={[
                          styles.timeButtonText,
                          selectedTime === time.value && styles.timeButtonTextSelected,
                        ]}
                      >
                        {time.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

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
                  Add at {formatTimeDisplay(selectedTime)}
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

  // Time Grid
  timeGrid: {
    maxHeight: 180,
    marginBottom: 20,
  },
  timeGridContent: {
    paddingBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  timeButton: {
    backgroundColor: palette.elevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    minWidth: 90,
    alignItems: 'center',
  },
  timeButtonSelected: {
    borderColor: palette.primary,
    backgroundColor: `${palette.primary}15`,
  },
  timeButtonText: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 14,
  },
  timeButtonTextSelected: {
    color: palette.primary,
    fontWeight: '600',
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
