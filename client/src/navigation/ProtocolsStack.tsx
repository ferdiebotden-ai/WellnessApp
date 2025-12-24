/**
 * ProtocolsStack Navigator
 *
 * Provides navigation within the Protocols tab:
 * - ModuleList: Shows all modules (focus areas)
 * - ModuleProtocols: Shows protocols for a specific module
 * - ProtocolDetail: Shows details of a specific protocol
 *
 * Session 83: Protocol Selection UX Overhaul
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ModuleListScreen } from '../screens/ModuleListScreen';
import { ModuleProtocolsScreen } from '../screens/ModuleProtocolsScreen';
import { ProtocolDetailScreen } from '../screens/ProtocolDetailScreen';
import { palette } from '../theme/palette';

export type ProtocolsStackParamList = {
  ModuleList: undefined;
  ModuleProtocols: {
    moduleId: string;
    moduleName: string;
  };
  ProtocolDetail: {
    protocolId: string;
    protocolName?: string;
    moduleId?: string;
    enrollmentId?: string;
    source?: 'schedule' | 'manual' | 'nudge' | 'browse';
    progressTarget?: number;
  };
};

const Stack = createNativeStackNavigator<ProtocolsStackParamList>();

/**
 * Navigation stack for the Protocols tab.
 * Enables browsing modules and their associated protocols.
 */
export const ProtocolsStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: palette.textPrimary,
      headerStyle: { backgroundColor: palette.background },
      contentStyle: { backgroundColor: palette.background },
    }}
  >
    <Stack.Screen
      name="ModuleList"
      component={ModuleListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ModuleProtocols"
      component={ModuleProtocolsScreen}
      options={({ route }) => ({
        title: route.params.moduleName,
        headerBackTitle: 'Modules',
      })}
    />
    <Stack.Screen
      name="ProtocolDetail"
      component={ProtocolDetailScreen as React.ComponentType<object>}
      options={({ route }) => ({
        title: route.params.protocolName || 'Protocol',
        headerBackTitle: 'Back',
      })}
    />
  </Stack.Navigator>
);
