import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ModuleCard } from '../components/ModuleCard';
import { useCoreModules } from '../hooks/useCoreModules';
import { completeOnboarding } from '../services/api';
import type { ModuleSummary } from '../types/module';

const KEY_EXTRACTOR = (item: ModuleSummary) => item.id;

export const ModuleOnboardingScreen: React.FC = () => {
  const { modules, status, error, reload } = useCoreModules();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selectedModuleId) {
      Alert.alert('Choose a focus', 'Please select your primary wellness goal to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding(selectedModuleId);
      Alert.alert('You\'re all set!', 'Welcome to your tailored Wellness journey.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
      Alert.alert('Something went wrong', message, [
        { text: 'Try again', onPress: () => void handleContinue() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      setSubmitting(false);
    }
  }, [selectedModuleId]);

  const renderItem = ({ item }: { item: ModuleSummary }) => (
    <ModuleCard module={item} selected={item.id === selectedModuleId} onSelect={handleSelect} />
  );

  const showLoading = status === 'loading' && modules.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose your first focus area</Text>
        <Text style={styles.subtitle}>We\'ll personalize your Wellness OS experience around this core module.</Text>
      </View>

      {showLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryLink} onPress={() => reload()}>
            Tap to retry
          </Text>
        </View>
      ) : (
        <FlatList
          data={modules}
          keyExtractor={KEY_EXTRACTOR}
          renderItem={renderItem}
          extraData={selectedModuleId}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.footer}>
        <Text
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting }}
          onPress={() => {
            if (!submitting) {
              void handleContinue();
            }
          }}
          style={[styles.primaryButton, submitting ? styles.primaryButtonDisabled : null]}
        >
          {submitting ? 'Starting your trial…' : 'Start my 14-day trial'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginTop: 8,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryLink: {
    fontSize: 16,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    textAlign: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
});
