/**
 * useChatConversation Hook
 *
 * Manages persistent chat conversation state with history loading.
 * Persists conversationId to AsyncStorage so conversations resume on app restart.
 *
 * @file client/src/hooks/useChatConversation.ts
 * @author Claude Opus 4.5 (Session 83)
 * @created December 24, 2025
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChatHistory, ChatHistoryMessage } from '../services/api';

// AsyncStorage key for persisting conversation ID
const CONVERSATION_ID_KEY = '@apex_os_chat_conversation_id';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatConversationResult {
  /** Current conversation ID (null if no conversation exists) */
  conversationId: string | null;
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Whether history is currently loading */
  loading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Load chat history from the API */
  loadHistory: () => Promise<void>;
  /** Start a new chat (clears messages and stored conversationId) */
  startNewChat: () => Promise<void>;
  /** Add a message to the conversation */
  addMessage: (message: ChatMessage) => void;
  /** Update the conversation ID (called after first message sent) */
  setConversationId: (id: string) => void;
}

/**
 * Hook for managing persistent chat conversations with history loading
 */
export function useChatConversation(): UseChatConversationResult {
  const [conversationId, setConversationIdState] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load stored conversation ID on mount
  useEffect(() => {
    const loadStoredConversationId = async () => {
      try {
        const storedId = await AsyncStorage.getItem(CONVERSATION_ID_KEY);
        if (storedId) {
          setConversationIdState(storedId);
        }
      } catch (err) {
        console.warn('[useChatConversation] Failed to load stored conversation ID:', err);
      } finally {
        setInitialized(true);
      }
    };

    loadStoredConversationId();
  }, []);

  // Load chat history from API
  const loadHistory = useCallback(async () => {
    if (!initialized) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchChatHistory(conversationId ?? undefined);

      if (response.conversationId) {
        // Update conversation ID if we got one from API
        setConversationIdState(response.conversationId);
        await AsyncStorage.setItem(CONVERSATION_ID_KEY, response.conversationId);

        // Convert API messages to ChatMessage format
        const loadedMessages: ChatMessage[] = response.messages.map(
          (msg: ChatHistoryMessage, index: number) => ({
            id: `history-${index}-${Date.now()}`,
            role: msg.role,
            content: msg.content,
          })
        );

        setMessages(loadedMessages);
      } else {
        // No conversation exists - start fresh
        setMessages([]);
      }
    } catch (err) {
      console.error('[useChatConversation] Failed to load history:', err);
      setError('Failed to load chat history');
      // Don't clear messages on error - keep any existing ones
    } finally {
      setLoading(false);
    }
  }, [initialized, conversationId]);

  // Start a new chat - clears everything
  const startNewChat = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CONVERSATION_ID_KEY);
    } catch (err) {
      console.warn('[useChatConversation] Failed to clear stored conversation ID:', err);
    }

    setConversationIdState(null);
    setMessages([]);
    setError(null);
  }, []);

  // Add a single message to the conversation
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Update conversation ID (and persist to storage)
  const setConversationId = useCallback(async (id: string) => {
    setConversationIdState(id);
    try {
      await AsyncStorage.setItem(CONVERSATION_ID_KEY, id);
    } catch (err) {
      console.warn('[useChatConversation] Failed to store conversation ID:', err);
    }
  }, []);

  return {
    conversationId,
    messages,
    loading,
    error,
    loadHistory,
    startNewChat,
    addMessage,
    setConversationId,
  };
}
