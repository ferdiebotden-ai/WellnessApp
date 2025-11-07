import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { WaitlistScreen } from '../screens/WaitlistScreen';
import { palette } from '../theme/palette';

export type HomeStackParamList = {
  Home: undefined;
  Waitlist: { tier: 'pro' | 'elite'; moduleName: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

/**
 * Navigation stack for the Home tab, including the waitlist experience for
 * locked premium modules.
 */
export const HomeStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: palette.textPrimary,
      headerStyle: { backgroundColor: palette.background },
      contentStyle: { backgroundColor: palette.background },
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="Waitlist"
      component={WaitlistScreen}
      options={{ title: 'Join the Waitlist' }}
    />
  </Stack.Navigator>
);
