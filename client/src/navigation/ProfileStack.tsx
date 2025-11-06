import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PrivacyDashboardScreen } from '../screens/PrivacyDashboardScreen';

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  PrivacyDashboard: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="ProfileOverview" component={ProfileScreen} />
    <Stack.Screen name="PrivacyDashboard" component={PrivacyDashboardScreen} />
  </Stack.Navigator>
);
