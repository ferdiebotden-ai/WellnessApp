import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { DashboardTask } from '../types/dashboard';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { AIThinkingState } from './AIThinkingState';

interface Props {
  loading: boolean;
  tasks: DashboardTask[];
  emptyMessage?: string;
}

const renderTask = ({ item }: { item: DashboardTask }) => {
  // Show AI thinking state for nudges that are being generated
  if (item.source === 'nudge' && item.isGenerating) {
    return <AIThinkingState visible={true} compact />;
  }

  const timeLabel = item.scheduledAt ? item.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Anytime';
  return (
    <View style={styles.taskItem}>
      <View style={styles.taskTextContainer}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskMeta}>{`${item.source === 'schedule' ? 'Scheduled' : 'Live Nudge'} • ${timeLabel}`}</Text>
      </View>
      {item.status === 'completed' && <Text style={styles.completed}>✓</Text>}
    </View>
  );
};

export const TaskList: React.FC<Props> = ({ loading, tasks, emptyMessage }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AIThinkingState
          visible={true}
          messages={['Syncing your day...', 'Loading your schedule...', 'Getting ready...']}
          interval={2000}
        />
      </View>
    );
  }

  if (!tasks.length) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{emptyMessage || 'No tasks scheduled right now.'}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderTask}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
      accessibilityRole="list"
      testID="task-list"
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  listContent: {
    gap: 16,
  },
  taskItem: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTextContainer: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  taskMeta: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
  },
  completed: {
    ...typography.heading,
    color: palette.success,
  },
  separator: {
    height: 12,
  },
});
