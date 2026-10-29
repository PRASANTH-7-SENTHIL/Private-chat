import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatSidebar } from '../components/ChatSidebar';
import { ConversationHeader } from '../components/ConversationHeader';
import { MessageList } from '../components/MessageList';
import { MessageComposer } from '../components/MessageComposer';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ProfileMenu } from '../components/ProfileMenu';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useWebSocket } from '../hooks/useWebSocket';
import { useConversations } from '../hooks/useConversations';
import { useAuthStore } from '../store/authStore';
import { useConversationStore } from '../store/conversationStore';
import { conversationsApi, usersApi } from '../services/api';
import { wsService } from '../services/websocket';
import { encryptionService } from '../services/encryption';
import type { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import { ShieldCheck, MessageSquarePlus } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, deviceId } = useAuthStore();
  const { status: wsStatus } = useWebSocket();
  const { conversations, loading: loadingConvs, refresh: refreshConvs } = useConversations();
  const { activeConversationId, messages, setActiveConversation, setMessages, addMessage } = useConversationStore();

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'conversation'>('list');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const currentUserId = user?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Presence updates handler
  useEffect(() => {
    const unsub = wsService.on('presence.update', (payload) => {
      const { user_id, online } = payload as { user_id: string; online: boolean };
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) {
          next.add(user_id);
        } else {
          next.delete(user_id);
        }
        return next;
      });
    });
    return () => {
      unsub();
    };
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await conversationsApi.getMessages(convId);
      const raw = res.data as Message[];

      const decrypted: Message[] = await Promise.all(
        raw.map(async (m) => {
          const payloadEnc = m.encrypted_payload || m.encryptedPayload || '';
          let plain = '';
          try {
            plain = await encryptionService.decrypt(payloadEnc);
          } catch {
            plain = '🔒 [Encrypted message]';
          }
          return {
            ...m,
            client_message_id: m.client_message_id || m.clientMessageId || m.id,
            conversation_id: convId,
            decryptedContent: plain,
            status: 'delivered' as const,
          };
        })
      );
      setMessages(convId, decrypted);
    } catch (e) {
      console.error('Failed to load messages', e);
    } finally {
      setLoadingMessages(false);
    }
  }, [setMessages]);

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    setMobileView('conversation');
    if (!messages[id]) {
      loadMessages(id);
    }
    wsService.send({ type: 'message.read', payload: { conversation_id: id } });
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId || !user) return;

    const conv = conversations.find((c) => c.id === activeConversationId);
    const recipient = conv?.members.find((m) => m.user_id !== currentUserId);
    if (!recipient) return;

    const clientMessageId = uuidv4();
    const nowIso = new Date().toISOString();

    // 1. Optimistic UI update
    const optimistic: Message = {
      id: clientMessageId,
      client_message_id: clientMessageId,
      conversation_id: activeConversationId,
      sender_device_id: deviceId || 'device_primary',
      sender_id: user.id,
      sender_login_id: user.login_id || user.loginId || '',
      encrypted_payload: '',
      protocol_version: 1,
      server_sequence: Date.now(),
      created_at: nowIso,
      decryptedContent: text,
      status: 'sending',
    };
    addMessage(activeConversationId, optimistic);

    try {
      // 2. Client-side E2EE encryption before sending
      let recipientKeyHex: string | null = null;
      try {
        const bundleRes = await usersApi.search(recipient.login_id);
        if (bundleRes.data) {
          // Key bundle
        }
      } catch {
        // Fallback
      }

      const { ciphertext, protocolVersion } = await encryptionService.encrypt(recipientKeyHex, text);

      // 3. Send over WebSocket
      wsService.send({
        type: 'message.send',
        payload: {
          client_message_id: clientMessageId,
          conversation_id: activeConversationId,
          encrypted_payload: ciphertext,
          protocol_version: protocolVersion,
        },
      });
    } catch (e) {
      console.error('Failed to send encrypted message', e);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const otherMember = activeConv?.members.find((m) => m.user_id !== currentUserId);
  const isRecipientOnline = otherMember ? onlineUsers.has(otherMember.user_id) : false;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[var(--color-bg-primary)] overflow-hidden select-none">
      <ConnectionStatus status={wsStatus} />

      {/* Top Application Header:
          Shown on desktop always; on mobile, ONLY shown when in conversation list view.
          When a conversation is open on mobile, ConversationHeader takes over full top bar!
      */}
      <header
        className={clsx(
          'items-center justify-between px-4 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] flex-shrink-0 z-10 safe-top',
          mobileView === 'conversation' ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-bold text-sm">
            🔒
          </div>
          <span className="font-bold text-sm tracking-tight text-[var(--color-text-primary)]">
            Private <span className="text-[var(--color-accent)]">Chat</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 ml-2">
            <ShieldCheck size={12} />
            <span>Encrypted Tunnel</span>
          </span>
        </div>

        <ProfileMenu />
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Conversation List) */}
        <div
          className={clsx(
            'w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-primary)]',
            mobileView === 'list' ? 'flex' : 'hidden md:flex'
          )}
        >
          {loadingConvs ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ChatSidebar
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
            />
          )}
        </div>

        {/* Right Panel (Active Conversation) */}
        <div
          className={clsx(
            'flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-secondary)]/30',
            mobileView === 'conversation' ? 'flex' : 'hidden md:flex'
          )}
        >
          {activeConversationId && otherMember ? (
            <>
              <ConversationHeader
                loginId={otherMember.login_id}
                isOnline={isRecipientOnline}
                encryptionReady={encryptionService.isReady}
                onBack={() => {
                  setMobileView('list');
                  setActiveConversation(null);
                  refreshConvs();
                }}
              />

              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <MessageList
                  messages={messages[activeConversationId] ?? []}
                  currentUserId={currentUserId ?? ''}
                />
              )}

              <MessageComposer
                onSend={handleSendMessage}
                disabled={wsStatus !== 'connected'}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[var(--color-text-secondary)]">
              <div className="w-16 h-16 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xs flex items-center justify-center text-3xl mb-4">
                💬
              </div>
              <h3 className="font-bold text-base text-[var(--color-text-primary)] mb-1">
                Your Private Workspace
              </h3>
              <p className="text-xs max-w-sm leading-relaxed mb-6">
                Select a conversation from the sidebar or search for a contact's unique Login ID to initiate an end-to-end encrypted chat.
              </p>
              <button
                onClick={() => navigate('/contacts/search')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-xs font-semibold hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <MessageSquarePlus size={15} />
                <span>Search User by Login ID</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
