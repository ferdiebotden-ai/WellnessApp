import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { sendChatQuery } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Inner component that uses SafeAreaInsets - must be inside SafeAreaProvider
const ChatModalContent: React.FC<Props> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Dismiss keyboard after sending
    Keyboard.dismiss();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { response, conversationId: newConvId } = await sendChatQuery(userMsg.content, conversationId);
      setConversationId(newConvId);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.';
      const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: errorMessage };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Coach</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

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
        />

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
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading || !input.trim()}
            style={styles.sendButton}
          >
            {loading ? <ActivityIndicator color={palette.primary} /> : <Text style={styles.sendText}>Send</Text>}
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: palette.background },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: palette.border },
  title: { ...typography.heading, color: palette.textPrimary },
  closeText: { ...typography.body, color: palette.primary },
  listContent: { padding: 20, paddingBottom: 10, flexGrow: 1 },
  bubble: { padding: 12, borderRadius: 12, maxWidth: '80%', marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: palette.primary },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: palette.surface },
  messageText: { ...typography.body },
  userText: { color: '#fff' },
  aiText: { color: palette.textPrimary },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.background,
  },
  input: { flex: 1, padding: 12, backgroundColor: palette.surface, borderRadius: 20, color: palette.textPrimary, maxHeight: 100 },
  sendButton: { paddingHorizontal: 8, paddingVertical: 4 },
  sendText: { ...typography.subheading, color: palette.primary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyTitle: { ...typography.heading, color: palette.textPrimary, marginBottom: 12, textAlign: 'center' },
  emptyText: { ...typography.body, color: palette.textSecondary, textAlign: 'center', lineHeight: 22 },
});

