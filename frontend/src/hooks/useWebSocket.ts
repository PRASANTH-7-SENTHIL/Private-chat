import { useEffect, useState } from 'react';
import { wsService } from '../services/websocket';
import { useAuthStore } from '../store/authStore';
import { useConversationStore } from '../store/conversationStore';
import { encryptionService } from '../services/encryption';
import type { Message } from '../types';

export function useWebSocket() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { addMessage, updateMessageStatus } = useConversationStore();

  useEffect(() => {
    if (!isAuthenticated) {
      wsService.disconnect();
      setStatus('disconnected');
      return;
    }

    wsService.connect(setStatus);

    const unsubNew = wsService.on('message.new', async (payload) => {
      const msg = payload as unknown as Message;
      const clientMsgId = msg.client_message_id || msg.clientMessageId || msg.id;
      const convId = msg.conversation_id || msg.conversationId || '';
      const payloadEnc = msg.encrypted_payload || msg.encryptedPayload || '';

      let decrypted = '';
      try {
        decrypted = await encryptionService.decrypt(payloadEnc);
      } catch {
        decrypted = '🔒 [Encrypted message]';
      }

      addMessage(convId, {
        ...msg,
        client_message_id: clientMsgId,
        conversation_id: convId,
        decryptedContent: decrypted,
        status: 'delivered',
      });
    });

    const unsubAck = wsService.on('message.ack', (payload) => {
      const { client_message_id, server_message_id, conversation_id } = payload as {
        client_message_id: string;
        server_message_id: string;
        conversation_id: string;
      };
      updateMessageStatus(conversation_id, client_message_id, 'sent', server_message_id);
    });

    const unsubDelivered = wsService.on('message.delivered', (payload) => {
      const { client_message_id, conversation_id } = payload as {
        client_message_id: string;
        conversation_id: string;
      };
      updateMessageStatus(conversation_id, client_message_id, 'delivered');
    });

    const unsubRead = wsService.on('message.read', (payload) => {
      const { client_message_id, conversation_id } = payload as {
        client_message_id?: string;
        conversation_id: string;
      };
      if (client_message_id) {
        updateMessageStatus(conversation_id, client_message_id, 'read');
      }
    });

    return () => {
      unsubNew();
      unsubAck();
      unsubDelivered();
      unsubRead();
      wsService.disconnect();
    };
  }, [isAuthenticated, addMessage, updateMessageStatus]);

  return { status };
}
