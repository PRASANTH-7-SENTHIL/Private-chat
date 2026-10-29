import { format } from 'date-fns';
import { DeliveryStatus } from './DeliveryStatus';
import type { Message } from '../types';
import clsx from 'clsx';

interface Props {
  message: Message;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: Props) {
  const text = message.decryptedContent ?? '🔒 (encrypted)';
  const dateStr = message.created_at || message.createdAt || new Date().toISOString();
  let time = '';
  try {
    time = format(new Date(dateStr), 'HH:mm');
  } catch {
    time = '';
  }

  return (
    <div className={clsx('flex w-full mb-2', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[88%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-sm shadow-2xs transition-all relative break-words',
          isMine
            ? 'rounded-br-xs bg-[var(--color-bubble-sent)] text-white shadow-sm'
            : 'rounded-bl-xs bg-[var(--color-bubble-received)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed select-text text-[13.5px] sm:text-sm">
          {text}
        </p>
        <div className={clsx('flex items-center gap-1 mt-1 select-none', isMine ? 'justify-end' : 'justify-start')}>
          <span className={clsx('text-[10.5px]', isMine ? 'text-white/80' : 'text-[var(--color-text-secondary)]')}>
            {time}
          </span>
          {isMine && <DeliveryStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}
