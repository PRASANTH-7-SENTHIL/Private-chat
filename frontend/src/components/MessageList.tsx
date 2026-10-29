import { useEffect, useRef, type UIEvent } from 'react';
import { MessageBubble } from './MessageBubble';
import { LoadingSpinner } from './LoadingSpinner';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  currentUserId: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export function MessageList({ messages, currentUserId, onLoadMore, hasMore, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      onScroll={handleScroll}
    >
      {loading && (
        <div className="flex justify-center py-3">
          <LoadingSpinner size={20} />
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)] text-sm space-y-2 select-none">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center text-xl">
            🔒
          </div>
          <p className="font-medium text-[var(--color-text-primary)]">End-to-End Encrypted Conversation</p>
          <p className="text-xs text-center max-w-xs">
            Messages sent in this conversation are encrypted on your device. Send a message to start!
          </p>
        </div>
      )}

      {messages.map((msg) => {
        const key = msg.client_message_id || msg.clientMessageId || msg.id;
        const sId = msg.sender_id || msg.senderId;
        const isMine = sId === currentUserId;
        return (
          <MessageBubble
            key={key}
            message={msg}
            isMine={isMine}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
