import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchCurrentUser, updateUserPreferences } from '../services/api';
import { useAuth } from '../providers/AuthProvider';
import { deactivatePushToken } from '../services/pushNotifications';
import { openPrivacyPolicy, openTermsOfService } from '../services/legalDocuments';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import type { ProfileStackParamList } from '../navigation/ProfileStack';

/** Format time string "HH:MM" to display format "10:00 PM" */
const formatTimeDisplay = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/** Time options for picker (every hour) */
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hours = i.toString().padStart(2, '0');
  return { value: `${hours}:00`, label: formatTimeDisplay(`${hours}:00`) };
});

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { signOut } = useAuth();
  const [socialAnonymous, setSocialAnonymous] = useState<boolean>(true);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Quiet Hours state (Session 65)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(false);
  const [quietStartTime, setQuietStartTime] = useState<string>('22:00');
  const [quietEndTime, setQuietEndTime] = useState<string>('07:00');
  const [isUpdatingQuietHours, setIsUpdatingQuietHours] = useState(false);

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        setIsLoadingPreferences(true);
        setPreferencesError(null);
        const response = await fetchCurrentUser();
        const prefs = response.user.preferences;
        const currentValue = prefs?.social_anonymous ?? true;
        setSocialAnonymous(currentValue);

        // Load quiet hours preferences (Session 65)
        setQuietHoursEnabled(prefs?.quiet_hours_enabled ?? false);
        setQuietStartTime(prefs?.quiet_start_time ?? '22:00');
        setQuietEndTime(prefs?.quiet_end_time ?? '07:00');
      } catch (error) {
        // Graceful degradation: use default value (true = anonymous) on load failure
        // Don't show error to user - toggle will work with default value
        console.error('Failed to load user preferences, using default', error);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    void loadUserPreferences();
  }, []);

  const handlePrivacyPress = useCallback(() => {
    navigation.navigate('PrivacyDashboard');
  }, [navigation]);

  const handleWearableSettingsPress = useCallback(() => {
    navigation.navigate('WearableSettings');
  }, [navigation]);

  const handleCalendarSettingsPress = useCallback(() => {
    navigation.navigate('CalendarSettings');
  }, [navigation]);

  const handleBiometricSettingsPress = useCallback(() => {
    navigation.navigate('BiometricSettings');
  }, [navigation]);

  // Session 65: Quiet hours handlers
  const updateQuietHoursPreferences = useCallback(
    async (updates: { enabled?: boolean; startTime?: string; endTime?: string }) => {
      try {
        setIsUpdatingQuietHours(true);
        setPreferencesError(null);

        // Optimistically update local state
        if (updates.enabled !== undefined) setQuietHoursEnabled(updates.enabled);
        if (updates.startTime !== undefined) setQuietStartTime(updates.startTime);
        if (updates.endTime !== undefined) setQuietEndTime(updates.endTime);

        // Fetch current preferences to merge with update
        const currentUserResponse = await fetchCurrentUser();
        const currentPreferences = currentUserResponse.user.preferences || {};

        // Merge quiet hours updates
        await updateUserPreferences({
          ...currentPreferences,
          quiet_hours_enabled: updates.enabled ?? quietHoursEnabled,
          quiet_start_time: updates.startTime ?? quietStartTime,
          quiet_end_time: updates.endTime ?? quietEndTime,
        });
      } catch (error) {
        console.error('Failed to update quiet hours:', error);
        // Revert optimistic updates
        const response = await fetchCurrentUser().catch(() => null);
        if (response) {
          const prefs = response.user.preferences;
          setQuietHoursEnabled(prefs?.quiet_hours_enabled ?? false);
          setQuietStartTime(prefs?.quiet_start_time ?? '22:00');
          setQuietEndTime(prefs?.quiet_end_time ?? '07:00');
        }
        setPreferencesError('Failed to update notification settings. Please try again.');
      } finally {
        setIsUpdatingQuietHours(false);
      }
    },
    [quietHoursEnabled, quietStartTime, quietEndTime]
  );

  const handleQuietHoursToggle = useCallback(
    (value: boolean) => {
      void updateQuietHoursPreferences({ enabled: value });
    },
    [updateQuietHoursPreferences]
  );

  const showTimePicker = useCallback(
    (type: 'start' | 'end') => {
      const currentTime = type === 'start' ? quietStartTime : quietEndTime;
      const title = type === 'start' ? 'Quiet Hours Start' : 'Quiet Hours End';

      // Create options array for Alert
      const options = TIME_OPTIONS.map((opt) => ({
        text: opt.label,
        onPress: () => {
          if (type === 'start') {
            void updateQuietHoursPreferences({ startTime: opt.value });
          } else {
            void updateQuietHoursPreferences({ endTime: opt.value });
          }
        },
      }));

      // Split into chunks for multiple alerts (iOS limitation)
      // Show common times in a simpler picker
      const commonTimes = [
        { value: '06:00', label: '6:00 AM' },
        { value: '07:00', label: '7:00 AM' },
        { value: '08:00', label: '8:00 AM' },
        { value: '21:00', label: '9:00 PM' },
        { value: '22:00', label: '10:00 PM' },
        { value: '23:00', label: '11:00 PM' },
      ];

      const alertOptions = commonTimes.map((opt) => ({
        text: opt.label,
        onPress: () => {
          if (type === 'start') {
            void updateQuietHoursPreferences({ startTime: opt.value });
          } else {
            void updateQuietHoursPreferences({ endTime: opt.value });
          }
        },
      }));

      Alert.alert(
        title,
        `Current: ${formatTimeDisplay(currentTime)}`,
        [...alertOptions, { text: 'Cancel', style: 'cancel' }]
      );
    },
    [quietStartTime, quietEndTime, updateQuietHoursPreferences]
  );

  const handleSocialAnonymousToggle = useCallback(
    async (value: boolean) => {
      try {
        setIsUpdatingPreferences(true);
        setPreferencesError(null);
        setSocialAnonymous(value);

        // Fetch current preferences to merge with the update
        const currentUserResponse = await fetchCurrentUser();
        const currentPreferences = currentUserResponse.user.preferences || {};

        // Merge the social_anonymous update with existing preferences
        await updateUserPreferences({
          ...currentPreferences,
          social_anonymous: value,
        });
      } catch (error) {
        console.error('Failed to update social anonymity preference', error);
        setSocialAnonymous(!value); // Revert toggle on error
        setPreferencesError('Failed to update preference. Please try again.');
      } finally {
        setIsUpdatingPreferences(false);
      }
    },
    []
  );

  const handleOpenPrivacyPolicy = useCallback(async () => {
    try {
      await openPrivacyPolicy();
    } catch (error) {
      console.error('Failed to open Privacy Policy:', error);
    }
  }, []);

  const handleOpenTermsOfService = useCallback(async () => {
    try {
      await openTermsOfService();
    } catch (error) {
      console.error('Failed to open Terms of Service:', error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              // Deactivate push tokens before signing out
              await deactivatePushToken();
              await signOut();
              // Navigation handled automatically by AuthProvider state change
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  }, [signOut]);

  return (
    <ScrollView contentContainerStyle={styles.container} testID="profile-screen">
      <Text style={styles.heading}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Biometric Profile</Text>
        <Text style={styles.cardBody}>
          Your age, height, and weight help personalize HRV baselines and protocol recommendations.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={handleBiometricSettingsPress}
          testID="open-biometric-settings"
        >
          <Text style={styles.primaryButtonText}>Edit Biometrics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Integrations</Text>
        <Text style={styles.cardBody}>
          Connect your wearables and calendars to personalize your recovery protocols.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={handleWearableSettingsPress}
          testID="open-wearable-settings"
        >
          <Text style={styles.secondaryButtonText}>Wearable Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={handleCalendarSettingsPress}
          testID="open-calendar-settings"
        >
          <Text style={styles.secondaryButtonText}>Calendar Integration</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy Controls</Text>
        <Text style={styles.cardBody}>
          Review how Wellness OS safeguards your personal information and exercise your privacy rights.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={handlePrivacyPress}
          testID="open-privacy-dashboard"
        >
          <Text style={styles.primaryButtonText}>Open Privacy Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Session 65: Quiet Hours / Notification Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        <Text style={styles.cardBody}>
          Set quiet hours to pause notifications during sleep or focus time.
        </Text>
        {isLoadingPreferences ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        ) : (
          <>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Enable Quiet Hours</Text>
              <Switch
                value={quietHoursEnabled}
                onValueChange={handleQuietHoursToggle}
                disabled={isUpdatingQuietHours}
                trackColor={{ false: palette.border, true: palette.primary }}
                thumbColor={palette.surface}
                testID="quiet-hours-toggle"
              />
            </View>
            {quietHoursEnabled && (
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerItem}>
                  <Text style={styles.timePickerLabel}>Start</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => showTimePicker('start')}
                    disabled={isUpdatingQuietHours}
                    testID="quiet-hours-start-time"
                  >
                    <Text style={styles.timePickerValue}>
                      {formatTimeDisplay(quietStartTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timePickerItem}>
                  <Text style={styles.timePickerLabel}>End</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => showTimePicker('end')}
                    disabled={isUpdatingQuietHours}
                    testID="quiet-hours-end-time"
                  >
                    <Text style={styles.timePickerValue}>
                      {formatTimeDisplay(quietEndTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {quietHoursEnabled && (
              <Text style={styles.quietHoursInfo}>
                Notifications paused {formatTimeDisplay(quietStartTime)} – {formatTimeDisplay(quietEndTime)}
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Legal</Text>
        <Text style={styles.cardBody}>
          View our Privacy Policy and Terms of Service.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={handleOpenPrivacyPolicy}
          testID="open-privacy-policy"
        >
          <Text style={styles.secondaryButtonText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={handleOpenTermsOfService}
          testID="open-terms-of-service"
        >
          <Text style={styles.secondaryButtonText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Social Features (Coming Soon)</Text>
        <Text style={styles.cardBody}>
          Choose how you'll appear in future leaderboards and challenges.
        </Text>
        {isLoadingPreferences ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        ) : (
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Appear anonymously in future social features</Text>
            <Switch
              value={socialAnonymous}
              onValueChange={handleSocialAnonymousToggle}
              disabled={isUpdatingPreferences}
              trackColor={{ false: palette.border, true: palette.primary }}
              thumbColor={palette.surface}
              testID="social-anonymous-toggle"
            />
          </View>
        )}
        {preferencesError && (
          <Text style={styles.errorText} testID="preferences-error">
            {preferencesError}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.cardBody}>
          Manage your Apex OS account settings.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.destructiveButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          testID="logout-button"
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={palette.white} />
          ) : (
            <Text style={styles.destructiveButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: palette.background,
    padding: 24,
    gap: 16,
  },
  heading: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  cardBody: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: palette.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.subheading,
    color: palette.surface,
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: palette.background,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryButtonText: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  loadingContainer: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    ...typography.body,
    color: palette.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    marginTop: 8,
    fontSize: 14,
  },
  // Session 65: Quiet Hours styles
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  timePickerItem: {
    flex: 1,
    gap: 4,
  },
  timePickerLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timePickerButton: {
    backgroundColor: palette.elevated,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  timePickerValue: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  quietHoursInfo: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  destructiveButton: {
    marginTop: 8,
    backgroundColor: palette.error,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  destructiveButtonText: {
    ...typography.subheading,
    color: palette.white,
  },
});
