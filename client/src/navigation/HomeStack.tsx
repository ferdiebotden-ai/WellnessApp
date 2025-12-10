import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { WaitlistScreen } from '../screens/WaitlistScreen';
import { ProtocolDetailScreen } from '../screens/ProtocolDetailScreen';
import { ProtocolBrowserScreen } from '../screens/ProtocolBrowserScreen';
import { palette } from '../theme/palette';

export type HomeStackParamList = {
  Home: undefined;
  Waitlist: { tier: 'pro' | 'elite'; moduleName: string };
  ProtocolBrowser: undefined;
  ProtocolDetail: {
    protocolId: string;
    protocolName?: string;
    moduleId?: string;
    enrollmentId?: string;
    source?: 'schedule' | 'manual' | 'nudge';
    progressTarget?: number;
  };
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
    <Stack.Screen
      name="ProtocolBrowser"
      component={ProtocolBrowserScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProtocolDetail"
      component={ProtocolDetailScreen}
      options={({ route }) => ({
        title: route.params.protocolName || 'Protocol',
        headerBackTitle: 'Back',
      })}
    />
  </Stack.Navigator>
);
