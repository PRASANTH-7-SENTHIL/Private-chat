import { Check, X, User } from 'lucide-react';
import type { ContactRequest } from '../types';

interface Props {
  request: ContactRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function ContactRequestCard({ request, onAccept, onReject }: Props) {
  return (
    <div className="flex items-center gap-3.5 p-4 border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
      <div className="w-11 h-11 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center font-bold">
        <User size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
          {request.sender_login_id}
        </div>
        <div className="text-xs text-[var(--color-text-secondary)]">
          Wants to establish encrypted chat connection
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(request.id)}
          className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          aria-label="Accept contact request"
        >
          <Check size={16} />
        </button>
        <button
          onClick={() => onReject(request.id)}
          className="p-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
          aria-label="Reject contact request"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
