import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ProtocolsScreen } from '../screens/ProtocolsScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { ProfileStackNavigator } from './ProfileStack';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

const Tab = createBottomTabNavigator();

const renderTabLabel = (label: string) => ({ focused }: { focused: boolean }) => (
  <Text
    style={{
      ...typography.caption,
      color: focused ? palette.primary : palette.textMuted,
    }}
  >
    {label}
  </Text>
);

export const BottomTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: palette.elevated,
        borderTopColor: palette.border,
        height: 72,
        paddingTop: 10,
      },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: renderTabLabel('Home') }} />
    <Tab.Screen
      name="Protocols"
      component={ProtocolsScreen}
      options={{ tabBarLabel: renderTabLabel('Protocols') }}
    />
    <Tab.Screen
      name="Insights"
      component={InsightsScreen}
      options={{ tabBarLabel: renderTabLabel('Insights') }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStackNavigator}
      options={{ tabBarLabel: renderTabLabel('Profile') }}
    />
  </Tab.Navigator>
);
