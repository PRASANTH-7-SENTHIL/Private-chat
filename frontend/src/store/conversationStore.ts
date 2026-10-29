import { create } from 'zustand';
import type { Conversation, Message } from '../types';

interface ConversationStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  updateMessageStatus: (conversationId: string, clientMessageId: string, status: Message['status'], serverId?: string) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      const clientMsgId = message.client_message_id || message.clientMessageId;
      if (existing.some((m) => (m.client_message_id || m.clientMessageId) === clientMsgId)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      };
    }),
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  updateMessageStatus: (conversationId, clientMessageId, status, serverId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          (m.client_message_id || m.clientMessageId) === clientMessageId
            ? { ...m, status, ...(serverId ? { id: serverId } : {}) }
            : m
        ),
      },
    })),
  prependMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...messages, ...(state.messages[conversationId] ?? [])],
      },
    })),
}));
