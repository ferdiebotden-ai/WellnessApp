import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import { useProtocolDetail } from '../hooks/useProtocolDetail';
import * as Haptics from 'expo-haptics';
import { enqueueProtocolLog } from '../services/protocolLogs';

interface ProtocolDetailScreenProps {
  route: {
    params: {
      protocolId: string;
      protocolName?: string;
      moduleId?: string;
      enrollmentId?: string;
      source?: 'schedule' | 'manual' | 'nudge';
      progressTarget?: number;
    };
  };
}

const parseDescription = (description?: string | string[]) => {
  if (!description) {
    return [] as string[];
  }

  const segments = Array.isArray(description)
    ? description
    : description
        .split(/\r?\n|\u2022/)
        .map((segment) => segment.replace(/^\s*[\u2022\-]+\s*/, ''));

  return segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .slice(0, 3);
};

export const ProtocolDetailScreen: React.FC<ProtocolDetailScreenProps> = ({ route }) => {
  const { protocolId, protocolName, moduleId: routeModuleId, enrollmentId, source, progressTarget } = route.params;
  const { protocol, status, error, reload } = useProtocolDetail(protocolId);
  const [evidenceVisible, setEvidenceVisible] = useState(false);
  const [logStatus, setLogStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [logError, setLogError] = useState<string | null>(null);

  const bullets = useMemo(() => parseDescription(protocol?.description), [protocol?.description]);
  const citations = protocol?.citations ?? [];
  const displayName = protocol?.name ?? protocolName ?? 'Protocol';
  const moduleId = routeModuleId;

  const handleLogComplete = useCallback(async () => {
    if (!protocolId || !moduleId) {
      setLogStatus('error');
      setLogError('Module context missing.');
      return;
    }

    setLogStatus('pending');
    setLogError(null);

    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await enqueueProtocolLog({
        protocolId,
        moduleId,
        enrollmentId,
        source,
        progressTarget,
        metadata: {
          protocolName: displayName,
        },
      });
      setLogStatus('success');
    } catch (logErr) {
      setLogStatus('error');
      setLogError(logErr instanceof Error ? logErr.message : 'Unable to log protocol right now.');
    }
  }, [protocolId, moduleId, enrollmentId, source, progressTarget, displayName]);

  const handleOpenEvidence = () => {
    setEvidenceVisible(true);
  };

  const handleCloseEvidence = () => {
    setEvidenceVisible(false);
  };

  const handleOpenCitation = (link: string) => {
    if (!link) {
      return;
    }
    void Linking.openURL(link);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {displayName}
        </Text>

        {status === 'loading' ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.messageWrapper}>
            <Text style={styles.errorText}>{error ?? 'Unable to load protocol details.'}</Text>
            <Text style={styles.retryLink} onPress={() => reload()}>
              Tap to retry
            </Text>
          </View>
        ) : null}

        {protocol ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Summary</Text>
            {bullets.length > 0 ? (
              bullets.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <Text style={styles.bulletMarker}>•</Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.placeholderText}>Summary coming soon.</Text>
            )}
          </View>
        ) : null}

        {protocol ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleOpenEvidence}
            style={styles.evidenceButton}
          >
            <Text style={styles.evidenceButtonLabel}>View Evidence</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={styles.logFooter}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !moduleId || logStatus === 'pending' || logStatus === 'success' }}
          disabled={!moduleId || logStatus === 'pending' || logStatus === 'success'}
          onPress={handleLogComplete}
          style={[styles.logButton, logStatus === 'success' ? styles.logButtonSuccess : null, !moduleId ? styles.logButtonDisabled : null]}
          testID="log-complete-button"
        >
          {logStatus === 'pending' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logButtonLabel}>
              {logStatus === 'success' ? '✓ Logged' : 'Log Complete'}
            </Text>
          )}
        </Pressable>
        {logError ? <Text style={styles.logErrorText}>{logError}</Text> : null}
      </View>

      <Modal
        animationType="slide"
        visible={evidenceVisible}
        transparent
        onRequestClose={handleCloseEvidence}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Scientific Evidence</Text>
            {citations.length > 0 ? (
              citations.map((citation) => (
                <Pressable
                  key={citation}
                  onPress={() => handleOpenCitation(citation)}
                  accessibilityRole="link"
                  style={styles.citationRow}
                >
                  <Text style={styles.citationText}>{citation}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.placeholderText}>Citations will be added soon.</Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={handleCloseEvidence}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  centered: {
    marginTop: 32,
  },
  messageWrapper: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#991b1b',
  },
  retryLink: {
    fontSize: 16,
    color: '#2563eb',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  logFooter: {
    padding: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 8,
  },
  logButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logButtonLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logButtonSuccess: {
    backgroundColor: '#16a34a',
  },
  logButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  logErrorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletMarker: {
    fontSize: 18,
    lineHeight: 24,
    color: '#2563eb',
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748b',
  },
  evidenceButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2563eb',
    borderRadius: 999,
  },
  evidenceButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  citationRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  citationText: {
    fontSize: 16,
    color: '#2563eb',
  },
  modalCloseButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    borderRadius: 8,
  },
  modalCloseLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
