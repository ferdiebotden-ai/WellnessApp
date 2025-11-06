import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import {
  fetchPrivacyLogs,
  requestAccountDeletion,
  requestUserDataExport,
  type PrivacyLogsResponse,
} from '../services/api';

const EMPTY_PRIVACY_STATE: PrivacyLogsResponse = {
  protocolLogs: [],
  aiAuditLog: [],
};

const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) {
    return 'Unknown date';
  }

  try {
    const parsed = new Date(value);
    return parsed.toLocaleString();
  } catch (error) {
    return value;
  }
};

const stringifyMetadata = (value: Record<string, unknown> | null | undefined): string | null => {
  if (!value || Object.keys(value).length === 0) {
    return null;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return null;
  }
};

export const PrivacyDashboardScreen: React.FC = () => {
  const [privacyData, setPrivacyData] = useState<PrivacyLogsResponse>(EMPTY_PRIVACY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const loadPrivacyData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const response = await fetchPrivacyLogs();
      setPrivacyData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load privacy data';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrivacyData();
  }, [loadPrivacyData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadPrivacyData();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadPrivacyData]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      await requestUserDataExport();
      Alert.alert(
        'Export Requested',
        'We are preparing your archive. A secure download link will be emailed to you within a few minutes.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to request export at this time.';
      Alert.alert('Export Failed', message);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    Alert.alert(
      'Confirm Account Deletion',
      'Deleting your account will remove all personal data, conversation history, and wearable records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAccount(true);
              await requestAccountDeletion();
              Alert.alert(
                'Deletion Scheduled',
                'Your account is queued for secure deletion. You will receive a confirmation email once the process is complete.'
              );
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unable to process deletion request right now.';
              Alert.alert('Deletion Failed', message);
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  }, []);

  const auditLogCount = privacyData.aiAuditLog.length;
  const protocolLogCount = privacyData.protocolLogs.length;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.heading}>Privacy Dashboard</Text>
      <Text style={styles.subheading}>
        Review and export the data Wellness OS stores on your behalf. All requests are processed using HIPAA-compliant controls.
      </Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.primaryButton, isExporting && styles.disabledButton]}
          onPress={handleExport}
          disabled={isExporting}
          testID="request-export"
        >
          <Text style={styles.primaryButtonText}>
            {isExporting ? 'Preparing export…' : 'Download my chat history'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={() =>
            Alert.alert(
              'Delete Conversations',
              'Conversation pruning will be connected in Mission 030. For now, request a full account deletion to purge all data.'
            )
          }
          testID="delete-conversations"
        >
          <Text style={styles.secondaryButtonText}>Delete all conversations</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.dangerButton, isDeletingAccount && styles.disabledButton]}
        onPress={handleDeleteAccount}
        disabled={isDeletingAccount}
        testID="request-account-deletion"
      >
        <Text style={styles.dangerButtonText}>
          {isDeletingAccount ? 'Processing deletion…' : 'Request full account deletion'}
        </Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : errorMessage ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={handleRefresh}>
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Protocol Logs ({protocolLogCount})</Text>
            {privacyData.protocolLogs.length === 0 ? (
              <Text style={styles.emptyState}>No protocol activity has been recorded yet.</Text>
            ) : (
              privacyData.protocolLogs.map((log) => {
                const metadata = stringifyMetadata(log.metadata);
                return (
                  <View key={log.id} style={styles.logCard}>
                    <Text style={styles.logTitle}>{log.protocolName ?? log.protocol_id ?? 'Protocol entry'}</Text>
                    <Text style={styles.logSubtitle}>Logged {formatTimestamp(log.logged_at)}</Text>
                    {log.status ? <Text style={styles.logBadge}>Status: {log.status}</Text> : null}
                    {log.module_id ? <Text style={styles.logBody}>Module: {log.module_id}</Text> : null}
                    {metadata ? <Text style={styles.codeBlock}>{metadata}</Text> : null}
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Audit Trail ({auditLogCount})</Text>
            {privacyData.aiAuditLog.length === 0 ? (
              <Text style={styles.emptyState}>No AI-assisted interactions have been logged yet.</Text>
            ) : (
              privacyData.aiAuditLog.map((entry) => {
                const metadata = stringifyMetadata(entry.metadata);
                return (
                  <View key={entry.id} style={styles.logCard}>
                    <Text style={styles.logTitle}>{entry.agent ?? entry.model ?? 'AI interaction'}</Text>
                    <Text style={styles.logSubtitle}>Captured {formatTimestamp(entry.created_at)}</Text>
                    {entry.action ? <Text style={styles.logBody}>Action: {entry.action}</Text> : null}
                    {entry.summary ? <Text style={styles.logBody}>{entry.summary}</Text> : null}
                    {metadata ? <Text style={styles.codeBlock}>{metadata}</Text> : null}
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: palette.background,
    padding: 24,
    gap: 20,
  },
  heading: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  subheading: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'column',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.subheading,
    color: palette.surface,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
  secondaryButtonText: {
    ...typography.body,
    color: palette.textPrimary,
  },
  dangerButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.error,
  },
  dangerButtonText: {
    ...typography.subheading,
    color: palette.surface,
  },
  disabledButton: {
    opacity: 0.7,
  },
  section: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  emptyState: {
    ...typography.body,
    color: palette.textSecondary,
  },
  logCard: {
    backgroundColor: palette.elevated,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  logTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  logSubtitle: {
    ...typography.caption,
    color: palette.textSecondary,
  },
  logBody: {
    ...typography.body,
    color: palette.textPrimary,
  },
  logBadge: {
    ...typography.caption,
    color: palette.textPrimary,
    backgroundColor: palette.background,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  codeBlock: {
    ...typography.caption,
    color: palette.textSecondary,
    backgroundColor: palette.background,
    padding: 12,
    borderRadius: 12,
  },
  loadingState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    textAlign: 'center',
  },
});
