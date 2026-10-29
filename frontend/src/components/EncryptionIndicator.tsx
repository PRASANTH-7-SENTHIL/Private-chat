import { ShieldCheck } from 'lucide-react';

export function EncryptionIndicator({ ready = true }: { ready?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
      title="Client-side End-to-End Encrypted (AES-GCM / ECDH). The server cannot read your messages."
    >
      <ShieldCheck size={13} />
      <span>E2EE</span>
    </span>
  );
}
