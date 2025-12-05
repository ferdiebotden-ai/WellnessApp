import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { DashboardTask } from '../types/dashboard';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { AIThinkingState } from './AIThinkingState';
import { NudgeCard } from './NudgeCard';
import { SwipeableNudge } from './SwipeableNudge';

interface Props {
  loading: boolean;
  tasks: DashboardTask[];
  emptyMessage?: string;
  /** Called when a task is marked complete */
  onComplete?: (task: DashboardTask) => void;
  /** Called when a task is dismissed */
  onDismiss?: (task: DashboardTask) => void;
  /** Map of task IDs currently being updated */
  updatingTasks?: Set<string>;
}

/**
 * Render individual task item.
 * Note: Action handlers are passed via context from TaskList.
 */
interface RenderTaskProps {
  item: DashboardTask;
  onComplete?: (task: DashboardTask) => void;
  onDismiss?: (task: DashboardTask) => void;
  isUpdating?: boolean;
}

const TaskItem: React.FC<RenderTaskProps> = ({
  item,
  onComplete,
  onDismiss,
  isUpdating = false,
}) => {
  // Show AI thinking state for nudges that are being generated
  if (item.source === 'nudge' && item.isGenerating) {
    return <AIThinkingState visible={true} compact />;
  }

  const timeLabel = item.scheduledAt
    ? item.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Anytime';

  // For nudges (with or without whyExpansion), wrap in SwipeableNudge
  if (item.source === 'nudge') {
    const handleComplete = onComplete ? () => onComplete(item) : undefined;
    const handleDismiss = onDismiss ? () => onDismiss(item) : undefined;

    return (
      <SwipeableNudge
        onSwipeRight={handleComplete}
        onSwipeLeft={handleDismiss}
        isUpdating={isUpdating}
        disabled={item.status !== 'pending'}
        testID={`swipeable-${item.id}`}
      >
        {item.whyExpansion ? (
          <NudgeCard
            task={item}
            onComplete={handleComplete}
            onDismiss={handleDismiss}
            isUpdating={isUpdating}
          />
        ) : (
          <View style={styles.taskItem}>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskMeta}>
                {`Live Nudge • ${timeLabel}`}
              </Text>
            </View>
            {item.status === 'completed' && <Text style={styles.completed}>✓</Text>}
            {item.status === 'dismissed' && <Text style={styles.dismissed}>✕</Text>}
          </View>
        )}
      </SwipeableNudge>
    );
  }

  // Default task item (scheduled tasks without swipe)
  return (
    <View style={styles.taskItem}>
      <View style={styles.taskTextContainer}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskMeta}>
          {`${item.source === 'schedule' ? 'Scheduled' : 'Live Nudge'} • ${timeLabel}`}
        </Text>
      </View>
      {item.status === 'completed' && <Text style={styles.completed}>✓</Text>}
    </View>
  );
};

export const TaskList: React.FC<Props> = ({
  loading,
  tasks,
  emptyMessage,
  onComplete,
  onDismiss,
  updatingTasks,
}) => {
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

  // Create renderItem function with handlers
  const renderItem = useCallback(
    ({ item }: { item: DashboardTask }) => (
      <TaskItem
        item={item}
        onComplete={onComplete}
        onDismiss={onDismiss}
        isUpdating={updatingTasks?.has(item.id)}
      />
    ),
    [onComplete, onDismiss, updatingTasks]
  );

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
      renderItem={renderItem}
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
  dismissed: {
    ...typography.heading,
    color: palette.textMuted,
  },
  separator: {
    height: 12,
  },
});
