import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useProtocolSearch } from '../hooks/useProtocolSearch';
import { ThinkingDots } from '../components/ui/ApexLoadingIndicator';
import { palette } from '../theme/palette';
import type { ProtocolSearchResult } from '../services/api';

interface ProtocolSearchScreenProps {
  navigation: {
    navigate: (screen: string, params: { protocolId: string; protocolName?: string }) => void;
  };
}

const KEY_EXTRACTOR = (item: ProtocolSearchResult) => item.id;
const getPrimaryDescription = (description?: string | string[]) => {
  if (!description) {
    return undefined;
  }
  if (Array.isArray(description)) {
    return description.find((entry) => entry && entry.trim().length > 0);
  }
  return description;
};

export const ProtocolSearchScreen: React.FC<ProtocolSearchScreenProps> = ({ navigation }) => {
  const { query, setQuery, results, status, error, search } = useProtocolSearch();

  const handleSubmit = useCallback(() => {
    void search(query);
  }, [query, search]);

  const handleSelect = useCallback(
    (item: ProtocolSearchResult) => {
      navigation.navigate('ProtocolDetail', {
        protocolId: item.id,
        protocolName: item.name ?? undefined,
      });
    },
    [navigation]
  );

  const renderItem = ({ item }: { item: ProtocolSearchResult }) => {
    const primaryDescription = getPrimaryDescription(item.description ?? undefined);

    return (
      <Pressable style={styles.resultCard} onPress={() => handleSelect(item)}>
        <Text style={styles.resultTitle}>{item.name ?? 'Untitled Protocol'}</Text>
        {primaryDescription ? <Text style={styles.resultDescription}>{primaryDescription}</Text> : null}
      </Pressable>
    );
  };

  const renderSeparator = () => <View style={styles.itemSeparator} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search evidence-backed protocols</Text>
        <Text style={styles.subtitle}>Explore the interventions coaches use to personalize your plan.</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Search protocols"
          placeholder="e.g. Sleep, Glucose, Recovery"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        <Pressable accessibilityRole="button" style={styles.searchButton} onPress={handleSubmit}>
          <Text style={styles.searchButtonLabel}>Search</Text>
        </Pressable>
      </View>

      {status === 'loading' ? (
        <View style={styles.centerContent}>
          <ThinkingDots color={palette.primary} size={8} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryLink} onPress={handleSubmit}>
            Tap to retry
          </Text>
        </View>
      ) : null}

      {results.length === 0 && status !== 'loading' && !error ? (
        <View style={styles.centerContent}>
          <Text style={styles.placeholderText}>Start with a wellness goal to see relevant protocols.</Text>
        </View>
      ) : null}

      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={KEY_EXTRACTOR}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={renderSeparator}
          accessibilityRole="list"
        />
      ) : null}
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
    paddingBottom: 12,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 12,
  },
  searchButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    marginBottom: 8,
  },
  retryLink: {
    color: '#2563eb',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748b',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  itemSeparator: {
    height: 12,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  resultDescription: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
  },
});
