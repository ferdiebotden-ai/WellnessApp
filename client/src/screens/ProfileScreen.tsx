import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchCurrentUser, updateUserPreferences, getMVDStatus, activateMVD, deactivateMVD, type MVDStatus } from '../services/api';
import { useAuth } from '../providers/AuthProvider';
import { deactivatePushToken } from '../services/pushNotifications';
import { openPrivacyPolicy, openTermsOfService } from '../services/legalDocuments';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { Card } from '../components/ui/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { ApexLoadingIndicator } from '../components/ui/ApexLoadingIndicator';
import { haptic } from '../utils/haptics';
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

  // MVD (Minimum Viable Day) state (Session 71)
  const [mvdStatus, setMvdStatus] = useState<MVDStatus | null>(null);
  const [isLoadingMVD, setIsLoadingMVD] = useState(true);
  const [isUpdatingMVD, setIsUpdatingMVD] = useState(false);

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

    // Load MVD status (Session 71)
    const loadMVDStatus = async () => {
      try {
        setIsLoadingMVD(true);
        const status = await getMVDStatus();
        setMvdStatus(status);
      } catch (error) {
        console.error('Failed to load MVD status:', error);
        setMvdStatus({ active: false, type: null, reason: null, activated_at: null, expires_at: null });
      } finally {
        setIsLoadingMVD(false);
      }
    };

    void loadUserPreferences();
    void loadMVDStatus();
  }, []);

  const handlePrivacyPress = useCallback(() => {
    void haptic.light();
    navigation.navigate('PrivacyDashboard');
  }, [navigation]);

  const handleWearableSettingsPress = useCallback(() => {
    void haptic.light();
    navigation.navigate('WearableSettings');
  }, [navigation]);

  const handleCalendarSettingsPress = useCallback(() => {
    void haptic.light();
    navigation.navigate('CalendarSettings');
  }, [navigation]);

  const handleBiometricSettingsPress = useCallback(() => {
    void haptic.light();
    navigation.navigate('BiometricSettings');
  }, [navigation]);

  const handleWeeklyInsightsPress = useCallback(() => {
    void haptic.light();
    navigation.navigate('WeeklyInsights');
  }, [navigation]);

  // Session 71: MVD toggle handler
  const handleMVDToggle = useCallback(async (value: boolean) => {
    try {
      setIsUpdatingMVD(true);
      void haptic.light();

      // Optimistic update
      setMvdStatus((prev) => ({
        ...prev,
        active: value,
        type: value ? 'manual' : null,
        reason: value ? "You activated Recovery Mode" : null,
        activated_at: value ? new Date().toISOString() : null,
        expires_at: null,
      }));

      if (value) {
        await activateMVD();
      } else {
        await deactivateMVD();
      }

      // Refresh status from server to ensure consistency
      const status = await getMVDStatus();
      setMvdStatus(status);
    } catch (error) {
      console.error('Failed to update MVD status:', error);
      void haptic.error();
      // Revert optimistic update
      const status = await getMVDStatus().catch(() => ({
        active: false,
        type: null,
        reason: null,
        activated_at: null,
        expires_at: null,
      } as MVDStatus));
      setMvdStatus(status);
      Alert.alert('Error', 'Failed to update recovery mode. Please try again.');
    } finally {
      setIsUpdatingMVD(false);
    }
  }, []);

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

      <Card>
        <Text style={styles.cardTitle}>Biometric Profile</Text>
        <Text style={styles.cardBody}>
          Your age, height, and weight help personalize HRV baselines and protocol recommendations.
        </Text>
        <PrimaryButton
          title="Edit Biometrics"
          onPress={handleBiometricSettingsPress}
          style={styles.buttonSpacing}
          testID="open-biometric-settings"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Weekly Insights</Text>
        <Text style={styles.cardBody}>
          AI-generated analysis of your weekly patterns, progress, and personalized recommendations.
        </Text>
        <PrimaryButton
          title="View Weekly Insights"
          variant="secondary"
          onPress={handleWeeklyInsightsPress}
          style={styles.buttonSpacing}
          testID="open-weekly-insights"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Data Integrations</Text>
        <Text style={styles.cardBody}>
          Connect your wearables and calendars to personalize your recovery protocols.
        </Text>
        <PrimaryButton
          title="Wearable Settings"
          variant="secondary"
          onPress={handleWearableSettingsPress}
          style={styles.buttonSpacing}
          testID="open-wearable-settings"
        />
        <PrimaryButton
          title="Calendar Integration"
          variant="secondary"
          onPress={handleCalendarSettingsPress}
          style={styles.buttonSpacing}
          testID="open-calendar-settings"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Privacy Controls</Text>
        <Text style={styles.cardBody}>
          Review how Apex OS safeguards your personal information and exercise your privacy rights.
        </Text>
        <PrimaryButton
          title="Open Privacy Dashboard"
          onPress={handlePrivacyPress}
          style={styles.buttonSpacing}
          testID="open-privacy-dashboard"
        />
      </Card>

      {/* Session 65: Quiet Hours / Notification Settings */}
      <Card>
        <Text style={styles.cardTitle}>Notifications</Text>
        <Text style={styles.cardBody}>
          Set quiet hours to pause notifications during sleep or focus time.
        </Text>
        {isLoadingPreferences ? (
          <View style={styles.loadingContainer}>
            <ApexLoadingIndicator size={24} />
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
                  <Pressable
                    style={styles.timePickerButton}
                    onPress={() => showTimePicker('start')}
                    disabled={isUpdatingQuietHours}
                    testID="quiet-hours-start-time"
                  >
                    <Text style={styles.timePickerValue}>
                      {formatTimeDisplay(quietStartTime)}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.timePickerItem}>
                  <Text style={styles.timePickerLabel}>End</Text>
                  <Pressable
                    style={styles.timePickerButton}
                    onPress={() => showTimePicker('end')}
                    disabled={isUpdatingQuietHours}
                    testID="quiet-hours-end-time"
                  >
                    <Text style={styles.timePickerValue}>
                      {formatTimeDisplay(quietEndTime)}
                    </Text>
                  </Pressable>
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
      </Card>

      {/* Session 71: MVD (Recovery Mode) Toggle */}
      <Card>
        <Text style={styles.cardTitle}>Recovery Mode</Text>
        <Text style={styles.cardBody}>
          Having a tough day? Enable Recovery Mode to reduce your protocol load to essentials only.
        </Text>
        {isLoadingMVD ? (
          <View style={styles.loadingContainer}>
            <ApexLoadingIndicator size={24} />
          </View>
        ) : (
          <>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>I'm struggling today</Text>
              <Switch
                value={mvdStatus?.active ?? false}
                onValueChange={handleMVDToggle}
                disabled={isUpdatingMVD}
                trackColor={{ false: palette.border, true: palette.warning }}
                thumbColor={palette.surface}
                testID="mvd-toggle"
              />
            </View>
            {mvdStatus?.active && (
              <View style={styles.mvdActiveContainer}>
                <Text style={styles.mvdActiveText}>
                  Recovery Mode is active
                </Text>
                <Text style={styles.mvdReasonText}>
                  {mvdStatus.type === 'manual'
                    ? 'You activated this manually. Your schedule has been reduced to essential protocols only.'
                    : mvdStatus.type === 'low_recovery'
                    ? 'Auto-activated due to low recovery score. Take it easy today.'
                    : mvdStatus.type === 'travel'
                    ? 'Auto-activated because you are traveling. Protocols adjusted for your schedule.'
                    : mvdStatus.type === 'heavy_calendar'
                    ? 'Auto-activated due to a packed calendar. Essentials only today.'
                    : mvdStatus.type === 'consistency_drop'
                    ? 'Auto-activated to help you get back on track. Small wins matter.'
                    : 'Your schedule has been reduced to essential protocols only.'}
                </Text>
              </View>
            )}
          </>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Legal</Text>
        <Text style={styles.cardBody}>
          View our Privacy Policy and Terms of Service.
        </Text>
        <PrimaryButton
          title="Privacy Policy"
          variant="secondary"
          onPress={handleOpenPrivacyPolicy}
          style={styles.buttonSpacing}
          testID="open-privacy-policy"
        />
        <PrimaryButton
          title="Terms of Service"
          variant="secondary"
          onPress={handleOpenTermsOfService}
          style={styles.buttonSpacing}
          testID="open-terms-of-service"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Social Features (Coming Soon)</Text>
        <Text style={styles.cardBody}>
          Choose how you'll appear in future leaderboards and challenges.
        </Text>
        {isLoadingPreferences ? (
          <View style={styles.loadingContainer}>
            <ApexLoadingIndicator size={24} />
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
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.cardBody}>
          Manage your Apex OS account settings.
        </Text>
        <PrimaryButton
          title={isLoggingOut ? '' : 'Sign Out'}
          variant="destructive"
          onPress={handleLogout}
          disabled={isLoggingOut}
          loading={isLoggingOut}
          style={styles.buttonSpacing}
          testID="logout-button"
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: palette.canvas,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  heading: {
    ...typography.heading,
    color: palette.textPrimary,
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
  buttonSpacing: {
    marginTop: tokens.spacing.sm,
  },
  loadingContainer: {
    marginTop: tokens.spacing.sm,
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
  },
  toggleContainer: {
    marginTop: tokens.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  toggleLabel: {
    ...typography.body,
    color: palette.textPrimary,
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    marginTop: tokens.spacing.sm,
    fontSize: 14,
  },
  // Session 65: Quiet Hours styles
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
  timePickerItem: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  timePickerLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timePickerButton: {
    backgroundColor: palette.elevated,
    borderRadius: tokens.radius.sm,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
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
    marginTop: tokens.spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Session 71: MVD styles
  mvdActiveContainer: {
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.md,
    backgroundColor: `${palette.warning}15`,
    borderRadius: tokens.radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: palette.warning,
  },
  mvdActiveText: {
    ...typography.subheading,
    color: palette.warning,
    marginBottom: tokens.spacing.xs,
  },
  mvdReasonText: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
});
