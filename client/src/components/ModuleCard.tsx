import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModuleSummary } from '../types/module';

interface ModuleCardProps {
  module: ModuleSummary;
  selected: boolean;
  onSelect: (moduleId: string) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, selected, onSelect }) => {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onSelect(module.id)}
      style={[styles.card, selected ? styles.cardSelected : null]}
    >
      <View>
        <Text style={styles.title}>{module.name}</Text>
        {module.headline ? <Text style={styles.subtitle}>{module.headline}</Text> : null}
        {module.description ? <Text style={styles.description}>{module.description}</Text> : null}
      </View>
      {selected ? <Text style={styles.selectedLabel}>Selected</Text> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardSelected: {
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 12,
  },
});
