import React, { useMemo, useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { HealthMetricCard } from '../components/HealthMetricCard';
import { ModuleEnrollmentCard } from '../components/ModuleEnrollmentCard';
import { TaskList } from '../components/TaskList';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { useTaskFeed } from '../hooks/useTaskFeed';
import type { HealthMetric, ModuleEnrollment } from '../types/dashboard';
import { firebaseAuth } from '../services/firebase';
import { LockedModuleCard } from '../components/LockedModuleCard';
import type { HomeStackParamList } from '../navigation/HomeStack';

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Home'>;
import { useMonetization } from '../providers/MonetizationProvider';

const HEALTH_METRICS: HealthMetric[] = [
  { id: 'sleep', label: 'Sleep Quality', valueLabel: '92%', trend: 'up', progress: 0.92 },
  { id: 'hrv', label: 'HRV Readiness', valueLabel: '78 ms', trend: 'steady', progress: 0.78 },
];

const MODULE_ENROLLMENTS: ModuleEnrollment[] = [
  {
    id: 'resilience',
    title: 'Resilience Foundations',
    progressPct: 0.68,
    currentStreak: 6,
    focusArea: 'Emotional regulation',
    tier: 'core',
  },
  {
    id: 'sleep',
    title: 'Sleep Optimization',
    progressPct: 0.82,
    currentStreak: 9,
    focusArea: 'Deep sleep extension',
    tier: 'pro',
  },
];

interface LockedModule {
  id: string;
  title: string;
  description: string;
  tier: 'pro' | 'elite';
}

const LOCKED_MODULES: LockedModule[] = [
  {
    id: 'mod_stress_regulation',
    title: 'Stress & Emotional Regulation',
    description: 'Unlock HRV-guided breathing plans and advanced stress resilience analytics.',
    tier: 'pro',
  },
  {
    id: 'mod_energy_recovery',
    title: 'Energy & Recovery',
    description: 'Access metabolic recovery dashboards, cold exposure protocols, and readiness forecasting.',
    tier: 'pro',
  },
  {
    id: 'elite_concierge',
    title: 'Elite Concierge',
    description: 'Get 1:1 concierge coaching, lab integrations, and executive performance planning.',
    tier: 'elite',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const userId = firebaseAuth.currentUser?.uid ?? null;
  const { tasks, loading } = useTaskFeed(userId);
  const { requestProModuleAccess } = useMonetization();

  const handleModulePress = useCallback(
    (module: ModuleEnrollment) => {
      if (module.tier === 'pro') {
        const allowed = requestProModuleAccess();
        if (!allowed) {
          return;
        }
      }

      Alert.alert(module.title, 'Module details will be available soon.');
    },
    [requestProModuleAccess]
  );

  const orderedModules = useMemo(
    () => [...MODULE_ENROLLMENTS].sort((a, b) => b.progressPct - a.progressPct),
    []
  );

  const handleLockedModulePress = useCallback(
    (moduleId: string) => {
      const module = LOCKED_MODULES.find((item) => item.id === moduleId);
      if (!module) {
        return;
      }

      navigation.navigate('Waitlist', {
        tier: module.tier,
        moduleName: module.title,
      });
    },
    [navigation]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Outcomes</Text>
          <View style={styles.metricsRow}>
            {HEALTH_METRICS.map((metric) => (
              <HealthMetricCard metric={metric} key={metric.id} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Protocols</Text>
          <View style={styles.moduleStack}>
            {orderedModules.map((module) => (
              <ModuleEnrollmentCard
                key={module.id}
                module={module}
                locked={module.tier === 'pro'}
                onPress={() => handleModulePress(module)}
                testID={`module-card-${module.id}`}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlock Next-Level Modules</Text>
          <View style={styles.lockedModules}>
            {LOCKED_MODULES.map((module) => (
              <LockedModuleCard
                key={module.id}
                id={module.id}
                title={module.title}
                description={module.description}
                tier={module.tier}
                onPress={handleLockedModulePress}
              />
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.taskSection]}>
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <TaskList loading={loading} tasks={tasks} emptyMessage="Your schedule is clear." />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  moduleStack: {
    gap: 16,
  },
  lockedModules: {
    gap: 16,
  },
  taskSection: {
    paddingBottom: 16,
  },
});
