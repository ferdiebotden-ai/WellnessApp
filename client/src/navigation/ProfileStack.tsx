import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PrivacyDashboardScreen } from '../screens/PrivacyDashboardScreen';
import { WearableSettingsScreen } from '../screens/settings/WearableSettingsScreen';
import { CalendarSettingsScreen } from '../screens/settings/CalendarSettingsScreen';
import { BiometricSettingsScreen } from '../screens/settings/BiometricSettingsScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { palette } from '../theme/palette';

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  PrivacyDashboard: undefined;
  WearableSettings: undefined;
  CalendarSettings: undefined;
  BiometricSettings: undefined;
  WeeklyInsights: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: palette.textPrimary,
      headerStyle: { backgroundColor: palette.background },
      contentStyle: { backgroundColor: palette.background },
    }}
  >
    <Stack.Screen
      name="ProfileOverview"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="PrivacyDashboard"
      component={PrivacyDashboardScreen}
      options={{ title: 'Privacy Dashboard' }}
    />
    <Stack.Screen
      name="WearableSettings"
      component={WearableSettingsScreen}
      options={{ title: 'Wearable Settings' }}
    />
    <Stack.Screen
      name="CalendarSettings"
      component={CalendarSettingsScreen}
      options={{ title: 'Calendar Integration' }}
    />
    <Stack.Screen
      name="BiometricSettings"
      component={BiometricSettingsScreen}
      options={{ title: 'Biometric Profile' }}
    />
    <Stack.Screen
      name="WeeklyInsights"
      component={InsightsScreen}
      options={{ title: 'Weekly Insights' }}
    />
  </Stack.Navigator>
);
