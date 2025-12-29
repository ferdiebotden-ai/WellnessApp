/**
 * HealthDashboardScreen
 *
 * Comprehensive health data visualization dashboard.
 * Displays steps, sleep, HRV, RHR, and historical trends.
 *
 * Replaces the Insights tab in navigation.
 *
 * @file client/src/screens/HealthDashboardScreen.tsx
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  StepsProgressCard,
  SleepSummaryCard,
  HRVMetricCard,
  RHRMetricCard,
  TrendChart,
  chartColors,
  HealthEmptyState,
} from '../components/health';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { palette } from '../theme/palette';
import { typography, fontFamily } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { useTodayMetrics } from '../hooks/useTodayMetrics';
import { useHealthHistory } from '../hooks/useHealthHistory';
import { firebaseAuth } from '../services/firebase';

type ChartRange = 7 | 30;

export function HealthDashboardScreen(): React.ReactElement {
  const userId = firebaseAuth.currentUser?.uid ?? null;
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  // Today's metrics from Firestore (real-time)
  const { metrics, loading: loadingToday, error: todayError } = useTodayMetrics(userId);

  // Historical data for charts (no mock data - show empty state if no real data)
  const [chartRange, setChartRange] = useState<ChartRange>(7);
  const {
    data: historyData,
    loading: loadingHistory,
    error: historyError,
    isEmpty: isHistoryEmpty,
    refresh: refreshHistory,
    getMetricData,
  } = useHealthHistory({ days: chartRange });

  // Refresh handler
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  }, [refreshHistory]);

  // Get yesterday's steps for comparison
  const yesterdaySteps = useMemo(() => {
    if (!historyData?.days || historyData.days.length < 2) return null;
    const yesterday = historyData.days[historyData.days.length - 2];
    return yesterday?.steps ?? null;
  }, [historyData]);

  // Transform sleep data for SleepSummaryCard
  const sleepData = useMemo(() => {
    if (!metrics) {
      return {
        durationHours: null,
        efficiency: null,
        deepPct: null,
        remPct: null,
        bedtimeStart: null,
        bedtimeEnd: null,
      };
    }
    return {
      durationHours: metrics.sleep.durationHours,
      efficiency: metrics.sleep.efficiency,
      deepPct: metrics.sleep.deepPct,
      remPct: metrics.sleep.remPct,
      bedtimeStart: metrics.sleep.bedtimeStart,
      bedtimeEnd: metrics.sleep.bedtimeEnd,
    };
  }, [metrics]);

  // Extract HRV sparkline data
  const hrvSparkline = useMemo(() => {
    return getMetricData('hrv').slice(-7).map(d => d.value);
  }, [getMetricData]);

  // Extract RHR sparkline data
  const rhrSparkline = useMemo(() => {
    return getMetricData('rhr').slice(-7).map(d => d.value);
  }, [getMetricData]);

  // Parse baseline comparison strings to get trend direction
  const parseTrend = (comparison: string | null): 'up' | 'down' | 'stable' | null => {
    if (!comparison) return null;
    if (comparison.toLowerCase().includes('above') || comparison.toLowerCase().includes('+')) {
      return 'up';
    }
    if (comparison.toLowerCase().includes('below') || comparison.toLowerCase().includes('-')) {
      return 'down';
    }
    return 'stable';
  };

  // Loading state
  const isLoading = loadingToday || loadingHistory;

  // Check if today's metrics are empty (no real data from wearables)
  const isTodayEmpty = !metrics || (
    metrics.steps === null &&
    metrics.sleep.durationHours === null &&
    metrics.hrv.avg === null &&
    metrics.rhr.avg === null
  );

  // Show empty state when both today and history are empty
  const showEmptyState = !loadingToday && !loadingHistory && isTodayEmpty && isHistoryEmpty;

  // Handler for connecting wearables
  const handleConnectWearable = useCallback(() => {
    // Navigate to Profile tab, then to WearableSettings
    navigation.navigate('Profile', { screen: 'WearableSettings' });
  }, [navigation]);

  // Last sync info
  const lastSyncTime = useMemo(() => {
    if (!metrics?.lastSyncedAt) return null;
    const date = new Date(metrics.lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }, [metrics?.lastSyncedAt]);

  // Show empty state when no health data is available
  if (showEmptyState) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={palette.canvas} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health</Text>
        </View>
        <HealthEmptyState onConnectWearable={handleConnectWearable} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={palette.canvas} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health</Text>
          {lastSyncTime && (
            <View style={styles.syncInfo}>
              <Ionicons name="sync" size={12} color={palette.textMuted} />
              <Text style={styles.syncText}>{lastSyncTime}</Text>
            </View>
          )}
        </View>

        {/* Steps Progress */}
        <StepsProgressCard
          steps={metrics?.steps ?? null}
          goal={10000}
          yesterdaySteps={yesterdaySteps}
          loading={loadingToday}
        />

        {/* Sleep Summary */}
        <SleepSummaryCard
          sleep={sleepData}
          loading={loadingToday}
        />

        {/* Cardiovascular Metrics Grid */}
        <View style={styles.metricsGrid}>
          <HRVMetricCard
            value={metrics?.hrv.avg ?? null}
            method={metrics?.hrv.method}
            baselineComparison={metrics?.hrv.vsBaseline}
            trend={parseTrend(metrics?.hrv.vsBaseline ?? null)}
            sparklineData={hrvSparkline}
            loading={loadingToday}
          />
          <RHRMetricCard
            value={metrics?.rhr.avg ?? null}
            baselineComparison={metrics?.rhr.vsBaseline}
            trend={parseTrend(metrics?.rhr.vsBaseline ?? null)}
            sparklineData={rhrSparkline}
            loading={loadingToday}
          />
        </View>

        {/* Trends Section */}
        <View style={styles.trendsSection}>
          <View style={styles.trendsSectionHeader}>
            <Text style={styles.sectionTitle}>TRENDS</Text>
            <View style={styles.rangeToggle}>
              <Pressable
                style={[
                  styles.rangeButton,
                  chartRange === 7 && styles.rangeButtonActive,
                ]}
                onPress={() => setChartRange(7)}
              >
                <Text
                  style={[
                    styles.rangeButtonText,
                    chartRange === 7 && styles.rangeButtonTextActive,
                  ]}
                >
                  7d
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.rangeButton,
                  chartRange === 30 && styles.rangeButtonActive,
                ]}
                onPress={() => setChartRange(30)}
              >
                <Text
                  style={[
                    styles.rangeButtonText,
                    chartRange === 30 && styles.rangeButtonTextActive,
                  ]}
                >
                  30d
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Sleep Trend */}
          <View style={styles.chartCard}>
            <TrendChart
              data={getMetricData('sleep')}
              title="Sleep"
              unit="hours"
              color={chartColors.sleep.line}
              showAverage={true}
              showDots={chartRange === 7}
            />
          </View>

          {/* HRV Trend */}
          <View style={styles.chartCard}>
            <TrendChart
              data={getMetricData('hrv')}
              title="HRV"
              unit="ms"
              color={chartColors.hrv.line}
              showAverage={true}
              showDots={chartRange === 7}
            />
          </View>

          {/* Steps Trend */}
          <View style={styles.chartCard}>
            <TrendChart
              data={getMetricData('steps')}
              title="Steps"
              unit="steps"
              color={chartColors.steps.line}
              showAverage={true}
              showDots={chartRange === 7}
            />
          </View>
        </View>

        {/* Data Source */}
        {metrics?.wearableSource && (
          <View style={styles.dataSource}>
            <Ionicons name="watch" size={14} color={palette.textMuted} />
            <Text style={styles.dataSourceText}>
              Data from {metrics.wearableSource === 'apple_health' ? 'Apple Health' :
                metrics.wearableSource === 'health_connect' ? 'Health Connect' :
                metrics.wearableSource}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    ...typography.h1,
    color: palette.textPrimary,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    ...typography.caption,
    color: palette.textMuted,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  trendsSection: {
    marginTop: 8,
  },
  trendsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.label,
    color: palette.textMuted,
  },
  rangeToggle: {
    flexDirection: 'row',
    backgroundColor: palette.elevated,
    borderRadius: 8,
    padding: 2,
  },
  rangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rangeButtonActive: {
    backgroundColor: palette.surface,
  },
  rangeButtonText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: '600',
  },
  rangeButtonTextActive: {
    color: palette.textPrimary,
  },
  chartCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dataSource: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dataSourceText: {
    ...typography.caption,
    color: palette.textMuted,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default HealthDashboardScreen;
