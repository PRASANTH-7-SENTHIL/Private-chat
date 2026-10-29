import { useState, useRef, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter only if desktop without Shift, on mobile allow enter for newlines
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 sm:px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex-shrink-0 z-20">
      <div className="flex items-end gap-2 bg-[var(--color-bg-secondary)] rounded-2xl p-1.5 sm:p-2 border border-[var(--color-border)] focus-within:border-[var(--color-accent)] transition-all shadow-2xs">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type encrypted message…"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent resize-none outline-none text-sm px-2.5 py-1.5 max-h-32 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] leading-relaxed"
          aria-label="Message input"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="min-w-[42px] min-h-[42px] sm:min-w-[44px] sm:min-h-[44px] rounded-xl bg-[var(--color-accent)] text-white disabled:opacity-35 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center flex-shrink-0 touch-manipulation"
          aria-label="Send message"
        >
          <Send size={18} className="translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
