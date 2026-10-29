import { useEffect, useState, useCallback } from 'react';
import { conversationsApi } from '../services/api';
import { useConversationStore } from '../store/conversationStore';

export function useConversations() {
  const { conversations, setConversations } = useConversationStore();
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await conversationsApi.list();
      setConversations(res.data);
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setLoading(false);
    }
  }, [setConversations]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conversations, loading, refresh };
}
