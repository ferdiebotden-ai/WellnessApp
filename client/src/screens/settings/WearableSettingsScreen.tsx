/**
 * WearableSettingsScreen
 *
 * Settings screen for managing wearable device connections.
 * Displays HealthKit connection status, last sync time, and toggle for background delivery.
 *
 * @file client/src/screens/settings/WearableSettingsScreen.tsx
 * @author Claude Opus 4.5 (Session 37)
 * @created December 4, 2025
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { useHealthKit } from '../../hooks/useHealthKit';
import {
  useDataSourcePreference,
  DATA_SOURCE_LABELS,
  DATA_SOURCE_DESCRIPTIONS,
  type DataSourceOption,
} from '../../hooks/useDataSourcePreference';

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

export const WearableSettingsScreen: React.FC = () => {
  const {
    isAvailable,
    status,
    isLoading,
    requestPermission,
    enableBackgroundDelivery,
    disableBackgroundDelivery,
    isBackgroundEnabled,
    syncNow,
    isSyncing,
    lastSyncAt,
    error,
  } = useHealthKit();

  const {
    preference: dataSourcePreference,
    loading: loadingPreference,
    setPreference: setDataSourcePreference,
  } = useDataSourcePreference();

  const [isConnecting, setIsConnecting] = useState(false);

  const connectionStatus = !isAvailable
    ? 'unavailable'
    : status === 'authorized'
    ? 'connected'
    : 'disconnected';

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        await enableBackgroundDelivery();
        Alert.alert('Connected', 'HealthKit is now connected and syncing in the background.');
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable HealthKit access in Settings > Privacy > Health > Apex OS'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to connect to HealthKit');
    } finally {
      setIsConnecting(false);
    }
  }, [requestPermission, enableBackgroundDelivery]);

  const handleDisconnect = useCallback(async () => {
    Alert.alert('Disconnect HealthKit', 'Are you sure you want to disable HealthKit sync?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await disableBackgroundDelivery();
        },
      },
    ]);
  }, [disableBackgroundDelivery]);

  const handleBackgroundToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        await enableBackgroundDelivery();
      } else {
        await disableBackgroundDelivery();
      }
    },
    [enableBackgroundDelivery, disableBackgroundDelivery]
  );

  const handleSyncNow = useCallback(async () => {
    try {
      const readings = await syncNow();
      if (readings.length > 0) {
        Alert.alert('Sync Complete', `Synced ${readings.length} health readings.`);
      } else {
        Alert.alert('Sync Complete', 'No new data to sync.');
      }
    } catch (err) {
      Alert.alert('Sync Failed', 'Unable to sync health data at this time.');
    }
  }, [syncNow]);

  const handleDataSourceChange = useCallback(
    async (source: DataSourceOption) => {
      try {
        await setDataSourcePreference(source);
      } catch (err) {
        Alert.alert('Error', 'Failed to save preference');
      }
    },
    [setDataSourcePreference]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Loading wearable settings...</Text>
      </View>
    );
  }

  if (Platform.OS !== 'ios') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Android Health Connect</Text>
          <Text style={styles.cardSubtitle}>
            Health Connect integration is coming soon. For now, health data is synced through the
            existing wearable integration.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Apple Health Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Apple Health</Text>
            <StatusBadge status={connectionStatus} />
          </View>
          <Text style={styles.cardSubtitle}>
            Sync sleep, HRV, heart rate, and activity data from your Apple Watch and iPhone.
          </Text>
        </View>

        {connectionStatus === 'connected' ? (
          <>
            {/* Last Sync */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Last Sync</Text>
              <Text style={styles.rowValue}>{formatTimestamp(lastSyncAt)}</Text>
            </View>

            {/* Background Delivery Toggle */}
            <View style={styles.row}>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowLabel}>Background Sync</Text>
                <Text style={styles.rowHint}>
                  Automatically sync new health data even when the app is closed.
                </Text>
              </View>
              <Switch
                value={isBackgroundEnabled}
                onValueChange={handleBackgroundToggle}
                trackColor={{ false: palette.textMuted, true: palette.primary }}
                thumbColor={palette.white}
              />
            </View>

            {/* HRV Method Note */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>About HRV Data</Text>
              <Text style={styles.infoText}>
                Apple Health provides HRV as SDNN (24-hour aggregate), which measures overall
                autonomic balance. This is different from RMSSD used by some wearables like Oura.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSyncNow}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color={palette.white} />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Sync Now</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonOutline]}
                onPress={handleDisconnect}
              >
                <Text style={styles.buttonOutlineText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : connectionStatus === 'disconnected' ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, styles.buttonFullWidth]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <Text style={styles.buttonPrimaryText}>Connect Apple Health</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.unavailableBox}>
            <Text style={styles.unavailableText}>
              HealthKit is not available on this device. A physical iPhone is required for health
              data integration.
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Data Types Card */}
      {connectionStatus === 'connected' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Being Synced</Text>
          <View style={styles.dataTypeList}>
            <DataTypeItem label="Sleep Analysis" />
            <DataTypeItem label="Heart Rate Variability (SDNN)" />
            <DataTypeItem label="Resting Heart Rate" />
            <DataTypeItem label="Step Count" />
            <DataTypeItem label="Active Energy Burned" />
          </View>
        </View>
      )}

      {/* Data Source Preference Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Preferred Data Source</Text>
          <Text style={styles.cardSubtitle}>
            When multiple devices have data for the same metric, which source should be used for
            your recovery score?
          </Text>
        </View>

        {loadingPreference ? (
          <ActivityIndicator size="small" color={palette.primary} />
        ) : (
          <View style={styles.optionList}>
            {(['latest', 'apple_health', 'oura', 'whoop'] as DataSourceOption[]).map((option) => (
              <DataSourceOptionItem
                key={option}
                option={option}
                label={DATA_SOURCE_LABELS[option]}
                description={DATA_SOURCE_DESCRIPTIONS[option]}
                isSelected={dataSourcePreference === option}
                onPress={() => handleDataSourceChange(option)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyNote}>
        <Text style={styles.privacyText}>
          Your health data stays on your device and is only sent to your Apex OS account. We never
          share or sell your health information.
        </Text>
      </View>
    </ScrollView>
  );
};

const DataTypeItem: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.dataTypeItem}>
    <View style={styles.dataTypeCheck} />
    <Text style={styles.dataTypeLabel}>{label}</Text>
  </View>
);

interface DataSourceOptionItemProps {
  option: DataSourceOption;
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

const DataSourceOptionItem: React.FC<DataSourceOptionItemProps> = ({
  label,
  description,
  isSelected,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.optionContent}>
      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{label}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </View>
    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
      {isSelected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

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
  rowTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  rowLabel: {
    ...typography.body,
    color: palette.white,
  },
  rowValue: {
    ...typography.body,
    color: palette.textMuted,
  },
  rowHint: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 2,
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
  errorBox: {
    backgroundColor: palette.error + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    ...typography.caption,
    color: palette.error,
  },
  dataTypeList: {
    marginTop: 8,
  },
  dataTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dataTypeCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.success,
    marginRight: 12,
  },
  dataTypeLabel: {
    ...typography.body,
    color: palette.white,
  },
  privacyNote: {
    paddingHorizontal: 4,
  },
  privacyText: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Data Source Preference
  optionList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  optionItemSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primary + '10',
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    ...typography.body,
    color: palette.white,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: palette.primary,
    fontWeight: '600',
  },
  optionDescription: {
    ...typography.caption,
    color: palette.textMuted,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: palette.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.primary,
  },
});

export default WearableSettingsScreen;
