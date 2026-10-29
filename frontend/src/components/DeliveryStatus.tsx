import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import type { Message } from '../types';

export function DeliveryStatus({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'sending':
      return <Clock size={12} className="text-[var(--color-text-secondary)] opacity-70 animate-pulse" />;
    case 'sent':
      return <Check size={12} className="text-white/80" />;
    case 'delivered':
      return <CheckCheck size={12} className="text-white/80" />;
    case 'read':
      return <CheckCheck size={12} className="text-emerald-400 font-bold" />;
    case 'failed':
      return <AlertCircle size={12} className="text-rose-400" />;
    default:
      return null;
  }
}
