import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { sendChatQuery } from '../services/api';
import { AIThinkingState } from './AIThinkingState';
import { haptic } from '../utils/haptics';
import { useChatConversation, ChatMessage } from '../hooks/useChatConversation';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Inner component that uses SafeAreaInsets - must be inside SafeAreaProvider
const ChatModalContent: React.FC<Props> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Use persistent conversation hook
  const {
    conversationId,
    messages,
    loading: loadingHistory,
    loadHistory,
    startNewChat,
    addMessage,
    setConversationId,
  } = useChatConversation();

  // Load history when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible, loadHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleNewChat = useCallback(async () => {
    void haptic.light();
    await startNewChat();
  }, [startNewChat]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;

    // Haptic feedback and dismiss keyboard
    void haptic.light();
    Keyboard.dismiss();

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    addMessage(userMsg);
    setInput('');
    setSending(true);

    try {
      const { response, conversationId: newConvId } = await sendChatQuery(userMsg.content, conversationId ?? undefined);
      setConversationId(newConvId);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
      addMessage(aiMsg);
    } catch (error) {
      console.error('Chat error:', error);
      void haptic.error();
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.';
      const errorMsg: ChatMessage = { id: Date.now().toString(), role: 'assistant', content: errorMessage };
      addMessage(errorMsg);
    } finally {
      setSending(false);
    }
  }, [input, sending, conversationId, addMessage, setConversationId]);

  const handleClose = useCallback(() => {
    void haptic.light();
    onClose();
  }, [onClose]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Coach</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={handleNewChat} hitSlop={8} style={styles.newChatButton}>
              <Text style={styles.newChatText}>New Chat</Text>
            </Pressable>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>

        {loadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.aiText]}>{item.content}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Welcome to AI Coach</Text>
                <Text style={styles.emptyText}>Ask me anything about wellness, sleep optimization, stress management, or your health protocols.</Text>
              </View>
            }
            ListFooterComponent={
              sending ? (
                <View style={styles.thinkingContainer}>
                  <AIThinkingState visible={sending} compact />
                </View>
              ) : null
            }
          />
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach..."
            placeholderTextColor={palette.textMuted}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline={false}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={[styles.sendButton, (sending || !input.trim()) && styles.sendButtonDisabled]}
          >
            <Text style={[styles.sendText, (sending || !input.trim()) && styles.sendTextDisabled]}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Wrapper component that provides SafeAreaProvider context for the Modal
export const ChatModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaProvider>
        <ChatModalContent visible={visible} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.elevated,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  newChatButton: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    backgroundColor: palette.primary,
  },
  newChatText: {
    ...typography.caption,
    color: palette.canvas,
    fontWeight: '700',
  },
  closeText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  listContent: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
    flexGrow: 1,
  },
  bubble: {
    padding: tokens.spacing.md,
    maxWidth: '80%',
    marginBottom: tokens.spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: palette.primary,
    borderRadius: tokens.radius.md,
    borderTopRightRadius: tokens.radius.sm, // Smaller corner on user side
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surface,
    borderRadius: tokens.radius.md,
    borderTopLeftRadius: tokens.radius.sm, // Smaller corner on AI side
    borderWidth: 1,
    borderColor: palette.border,
  },
  messageText: {
    ...typography.body,
    lineHeight: 22,
  },
  userText: {
    color: palette.canvas, // Dark text on teal
  },
  aiText: {
    color: palette.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: palette.canvas,
  },
  input: {
    flex: 1,
    padding: tokens.spacing.md,
    backgroundColor: palette.surface,
    borderRadius: tokens.radius.lg, // Pill shape
    color: palette.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: palette.border,
    ...typography.body,
  },
  sendButton: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    ...typography.subheading,
    color: palette.primary,
    fontWeight: '600',
  },
  sendTextDisabled: {
    color: palette.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.xxl,
  },
  emptyTitle: {
    ...typography.heading,
    color: palette.textPrimary,
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  thinkingContainer: {
    alignSelf: 'flex-start',
    marginBottom: tokens.spacing.sm,
    maxWidth: '80%',
  },
});

