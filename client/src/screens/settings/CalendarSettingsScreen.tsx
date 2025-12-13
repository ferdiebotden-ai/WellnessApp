/**
 * CalendarSettingsScreen
 *
 * Settings screen for managing calendar integration.
 * Displays connection status, today's meeting load, and sync controls.
 * Privacy-first: Only meeting times are analyzed, never event details.
 *
 * @file client/src/screens/settings/CalendarSettingsScreen.tsx
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { palette } from '../../theme/palette';
import { ApexLoadingIndicator, ThinkingDots } from '../../components/ui/ApexLoadingIndicator';
import { typography } from '../../theme/typography';
import { useCalendar } from '../../hooks/useCalendar';
import type { CalendarProvider } from '../../services/calendar/types';

// =============================================================================
// CONSTANTS
// =============================================================================

const PROVIDER_LABELS: Record<CalendarProvider, string> = {
  device: Platform.OS === 'ios' ? 'Apple Calendar' : 'Device Calendar',
  google_calendar: 'Google Calendar',
};

const PROVIDER_DESCRIPTIONS: Record<CalendarProvider, string> = {
  device: Platform.OS === 'ios'
    ? 'Sync calendars from iCloud, Exchange, and other accounts on your iPhone.'
    : 'Sync calendars from your device\'s calendar provider.',
  google_calendar: 'Connect directly to your Google Calendar account.',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatTimestamp = (date: Date | null): string => {
  if (!date) {
    return 'Never';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return date.toLocaleDateString();
};

const getMeetingLoadLabel = (hours: number): { label: string; color: string } => {
  if (hours < 2) {
    return { label: 'Light', color: palette.success };
  }
  if (hours < 4) {
    return { label: 'Moderate', color: palette.secondary };
  }
  if (hours < 6) {
    return { label: 'Heavy', color: palette.accent };
  }
  return { label: 'Overload', color: palette.error };
};

// =============================================================================
// COMPONENTS
// =============================================================================

const StatusBadge: React.FC<{ status: 'connected' | 'disconnected' | 'unavailable' }> = ({
  status,
}) => {
  const colors = {
    connected: palette.success,
    disconnected: palette.accent,
    unavailable: palette.textMuted,
  };

  const labels = {
    connected: 'Connected',
    disconnected: 'Not Connected',
    unavailable: 'Unavailable',
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors[status] + '20' }]}>
      <View style={[styles.statusDot, { backgroundColor: colors[status] }]} />
      <Text style={[styles.statusText, { color: colors[status] }]}>{labels[status]}</Text>
    </View>
  );
};

interface ProviderCardProps {
  provider: CalendarProvider;
  isConnected: boolean;
  isActive: boolean;
  lastSyncAt: Date | null;
  isSyncing: boolean;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  isAvailable: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'checking';
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  isConnected,
  isActive,
  lastSyncAt,
  isSyncing,
  onConnect,
  onSync,
  onDisconnect,
  isConnecting,
  isAvailable,
  permissionStatus,
}) => {
  const connectionStatus = !isAvailable
    ? 'unavailable'
    : isConnected
    ? 'connected'
    : 'disconnected';

  // For Google Calendar, show coming soon for now
  if (provider === 'google_calendar') {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{PROVIDER_LABELS[provider]}</Text>
            <View style={[styles.statusBadge, { backgroundColor: palette.textMuted + '20' }]}>
              <Text style={[styles.statusText, { color: palette.textMuted }]}>Coming Soon</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>{PROVIDER_DESCRIPTIONS[provider]}</Text>
        </View>

        <View style={styles.unavailableBox}>
          <Text style={styles.unavailableText}>
            Google Calendar OAuth integration is planned for a future release.
            Use device calendar for now.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{PROVIDER_LABELS[provider]}</Text>
          <StatusBadge status={connectionStatus} />
        </View>
        <Text style={styles.cardSubtitle}>{PROVIDER_DESCRIPTIONS[provider]}</Text>
      </View>

      {connectionStatus === 'connected' ? (
        <>
          {/* Last Sync */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Last Sync</Text>
            <Text style={styles.rowValue}>{formatTimestamp(lastSyncAt)}</Text>
          </View>

          {/* Active Provider Indicator */}
          {isActive && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Active Calendar</Text>
              <Text style={styles.infoText}>
                This calendar is currently used for meeting load detection. Heavy meeting
                days (&gt;4h) may trigger Minimum Viable Day mode for your protocols.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ThinkingDots color={palette.white} size={6} />
              ) : (
                <Text style={styles.buttonPrimaryText}>Sync Now</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={onDisconnect}
            >
              <Text style={styles.buttonOutlineText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : connectionStatus === 'disconnected' ? (
        <>
          {permissionStatus === 'denied' && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Calendar access was denied. Please enable it in Settings &gt; Privacy &gt;
                Calendars &gt; Apex OS
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, styles.buttonFullWidth]}
            onPress={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ThinkingDots color={palette.white} size={6} />
            ) : (
              <Text style={styles.buttonPrimaryText}>Connect {PROVIDER_LABELS[provider]}</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.unavailableBox}>
          <Text style={styles.unavailableText}>
            Calendar access is not available on this platform. Try using the web version
            or a mobile device.
          </Text>
        </View>
      )}
    </View>
  );
};

// =============================================================================
// MAIN SCREEN
// =============================================================================

export const CalendarSettingsScreen: React.FC = () => {
  const {
    isAvailable,
    isLoading,
    permissionStatus,
    requestPermission,
    isConnected,
    provider,
    lastSyncAt,
    syncNow,
    isSyncing,
    todayMetrics,
    isHeavyDay,
    disconnect,
    error,
    clearError,
  } = useCalendar();

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(async (targetProvider: CalendarProvider) => {
    setIsConnecting(true);
    try {
      if (targetProvider === 'device') {
        const granted = await requestPermission();
        if (granted) {
          const success = await syncNow('device');
          if (success) {
            Alert.alert('Connected', 'Calendar is now connected and synced.');
          }
        } else {
          Alert.alert(
            'Permission Denied',
            'Please enable Calendar access in Settings > Privacy > Calendars > Apex OS'
          );
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to connect calendar');
    } finally {
      setIsConnecting(false);
    }
  }, [requestPermission, syncNow]);

  const handleSync = useCallback(async (targetProvider: CalendarProvider) => {
    try {
      const success = await syncNow(targetProvider);
      if (success) {
        Alert.alert('Sync Complete', 'Calendar data has been synced.');
      } else {
        Alert.alert('Sync Failed', 'Unable to sync calendar at this time.');
      }
    } catch (err) {
      Alert.alert('Sync Failed', 'Unable to sync calendar at this time.');
    }
  }, [syncNow]);

  const handleDisconnect = useCallback(async (targetProvider: CalendarProvider) => {
    Alert.alert(
      'Disconnect Calendar',
      'Are you sure you want to disconnect this calendar? Meeting load detection will be disabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnect(targetProvider);
          },
        },
      ]
    );
  }, [disconnect]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ApexLoadingIndicator size={48} />
        <Text style={styles.loadingText}>Loading calendar settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Today's Meeting Load Card */}
      {isConnected && todayMetrics && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Meeting Load</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{todayMetrics.totalHours.toFixed(1)}h</Text>
              <Text style={styles.metricLabel}>Total Hours</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{todayMetrics.meetingCount}</Text>
              <Text style={styles.metricLabel}>Meetings</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{todayMetrics.backToBackCount}</Text>
              <Text style={styles.metricLabel}>Back-to-Back</Text>
            </View>
          </View>

          <View style={styles.loadIndicator}>
            <Text style={styles.loadLabel}>Load Level:</Text>
            <View style={[
              styles.loadBadge,
              { backgroundColor: getMeetingLoadLabel(todayMetrics.totalHours).color + '20' }
            ]}>
              <Text style={[
                styles.loadBadgeText,
                { color: getMeetingLoadLabel(todayMetrics.totalHours).color }
              ]}>
                {getMeetingLoadLabel(todayMetrics.totalHours).label}
              </Text>
            </View>
          </View>

          {isHeavyDay && (
            <View style={styles.mvdWarningBox}>
              <Text style={styles.mvdWarningTitle}>Heavy Meeting Day</Text>
              <Text style={styles.mvdWarningText}>
                Minimum Viable Day mode may be activated to help you recover. Focus on
                essential protocols only.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Device Calendar Card */}
      <ProviderCard
        provider="device"
        isConnected={isConnected && provider === 'device'}
        isActive={provider === 'device'}
        lastSyncAt={lastSyncAt}
        isSyncing={isSyncing}
        onConnect={() => handleConnect('device')}
        onSync={() => handleSync('device')}
        onDisconnect={() => handleDisconnect('device')}
        isConnecting={isConnecting}
        isAvailable={isAvailable}
        permissionStatus={permissionStatus}
      />

      {/* Google Calendar Card (Coming Soon) */}
      <ProviderCard
        provider="google_calendar"
        isConnected={false}
        isActive={false}
        lastSyncAt={null}
        isSyncing={false}
        onConnect={() => {}}
        onSync={() => {}}
        onDisconnect={() => {}}
        isConnecting={false}
        isAvailable={false}
        permissionStatus="undetermined"
      />

      {/* Privacy Note */}
      <View style={styles.privacyNote}>
        <Text style={styles.privacyTitle}>Privacy-First Approach</Text>
        <Text style={styles.privacyText}>
          Apex OS only analyzes meeting times (start and end) to calculate your daily
          meeting load. Event titles, descriptions, attendees, and other details are
          never accessed or stored.
        </Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: 12,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    ...typography.heading,
    color: palette.white,
  },
  cardSubtitle: {
    ...typography.body,
    color: palette.textMuted,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  rowLabel: {
    ...typography.body,
    color: palette.white,
  },
  rowValue: {
    ...typography.body,
    color: palette.textMuted,
  },
  infoBox: {
    backgroundColor: palette.secondary + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoTitle: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    ...typography.caption,
    color: palette.textMuted,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFullWidth: {
    marginTop: 16,
  },
  buttonPrimary: {
    backgroundColor: palette.primary,
  },
  buttonPrimaryText: {
    ...typography.subheading,
    color: palette.white,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.border,
  },
  buttonOutlineText: {
    ...typography.subheading,
    color: palette.textMuted,
  },
  unavailableBox: {
    backgroundColor: palette.textMuted + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  unavailableText: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: palette.accent + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    ...typography.caption,
    color: palette.accent,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: palette.error + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    ...typography.caption,
    color: palette.error,
    flex: 1,
  },
  errorDismiss: {
    ...typography.caption,
    color: palette.error,
    fontWeight: '600',
    marginLeft: 12,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.heading,
    color: palette.white,
    fontSize: 24,
  },
  metricLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 4,
  },

  // Load Indicator
  loadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },
  loadLabel: {
    ...typography.body,
    color: palette.textMuted,
    marginRight: 8,
  },
  loadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },

  // MVD Warning
  mvdWarningBox: {
    backgroundColor: palette.accent + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  mvdWarningTitle: {
    ...typography.caption,
    color: palette.accent,
    fontWeight: '600',
    marginBottom: 4,
  },
  mvdWarningText: {
    ...typography.caption,
    color: palette.textMuted,
    lineHeight: 18,
  },

  // Privacy Note
  privacyNote: {
    paddingHorizontal: 4,
    marginTop: 8,
  },
  privacyTitle: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  privacyText: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default CalendarSettingsScreen;
