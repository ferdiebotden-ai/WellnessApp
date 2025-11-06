import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import type { ProfileStackParamList } from '../navigation/ProfileStack';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const handlePrivacyPress = useCallback(() => {
    navigation.navigate('PrivacyDashboard');
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
});
