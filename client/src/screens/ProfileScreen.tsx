import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchCurrentUser, updateUserPreferences } from '../services/api';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import type { ProfileStackParamList } from '../navigation/ProfileStack';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [socialAnonymous, setSocialAnonymous] = useState<boolean>(true);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        setIsLoadingPreferences(true);
        setPreferencesError(null);
        const response = await fetchCurrentUser();
        const currentValue = response.user.preferences?.social_anonymous ?? true;
        setSocialAnonymous(currentValue);
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

  return (
    <ScrollView contentContainerStyle={styles.container} testID="profile-screen">
      <Text style={styles.heading}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Professional Data</Text>
        <Text style={styles.cardBody}>
          Update your biometric integrations, preferred clinician, and emergency contact information from this secure view.
        </Text>
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
});
