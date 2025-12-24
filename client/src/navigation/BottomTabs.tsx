/**
 * BottomTabs - Enhanced tab navigation
 *
 * Features:
 * - Geometric icons for each tab
 * - Haptic feedback on tab switch
 * - Teal active indicator with glow
 * - Press animation
 *
 * @file client/src/navigation/BottomTabs.tsx
 * @author Claude Opus 4.5 (Session 68)
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { HomeStackNavigator } from './HomeStack';
import { ProtocolsStackNavigator } from './ProtocolsStack';
import { InsightsScreen } from '../screens/InsightsScreen';
import { ProfileStackNavigator } from './ProfileStack';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { haptic } from '../utils/haptics';

// =============================================================================
// TYPES
// =============================================================================

type TabName = 'Home' | 'Protocols' | 'Insights' | 'Profile';

interface TabConfig {
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  label: string;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

const TAB_CONFIG: Record<TabName, TabConfig> = {
  Home: {
    icon: 'home-outline',
    iconFocused: 'home',
    label: 'Home',
  },
  Protocols: {
    icon: 'grid-outline',
    iconFocused: 'grid',
    label: 'Protocols',
  },
  Insights: {
    icon: 'analytics-outline',
    iconFocused: 'analytics',
    label: 'Insights',
  },
  Profile: {
    icon: 'person-outline',
    iconFocused: 'person',
    label: 'Profile',
  },
};

// =============================================================================
// ANIMATED TAB BUTTON
// =============================================================================

interface TabButtonProps {
  name: TabName;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabButton({ name, isFocused, onPress, onLongPress }: TabButtonProps) {
  const config = TAB_CONFIG[name];
  const scale = useSharedValue(1);
  const indicatorOpacity = useSharedValue(isFocused ? 1 : 0);

  // Update indicator when focus changes
  React.useEffect(() => {
    indicatorOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused, indicatorOpacity]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    haptic.selection();
    onPress();
  }, [onPress]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [
      { scaleX: interpolate(indicatorOpacity.value, [0, 1], [0.5, 1]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(indicatorOpacity.value, [0, 1], [0, 0.15]),
  }));

  return (
    <AnimatedPressable
      style={[styles.tabButton, buttonStyle]}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={config.label}
      testID={`tab-${name.toLowerCase()}`}
    >
      {/* Glow effect behind icon when active */}
      <Animated.View style={[styles.iconGlow, glowStyle]} />

      {/* Icon */}
      <Ionicons
        name={isFocused ? config.iconFocused : config.icon}
        size={24}
        color={isFocused ? palette.primary : palette.textMuted}
        style={styles.icon}
      />

      {/* Label */}
      <Text
        style={[
          styles.label,
          { color: isFocused ? palette.primary : palette.textMuted },
        ]}
      >
        {config.label}
      </Text>

      {/* Active indicator bar */}
      <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
    </AnimatedPressable>
  );
}

// =============================================================================
// CUSTOM TAB BAR
// =============================================================================

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabButton
            key={route.key}
            name={route.name as TabName}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

// =============================================================================
// TAB NAVIGATOR
// =============================================================================

const Tab = createBottomTabNavigator();

export const BottomTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeStackNavigator} />
    <Tab.Screen name="Protocols" component={ProtocolsStackNavigator} />
    <Tab.Screen name="Insights" component={InsightsScreen} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.elevated,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    height: 72,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: tokens.spacing.md,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  icon: {
    marginBottom: 4,
  },

  iconGlow: {
    position: 'absolute',
    top: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primary,
  },

  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '500',
  },

  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.primary,
    // Subtle glow
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
});
