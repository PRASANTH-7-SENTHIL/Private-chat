import { ArrowLeft, MoreVertical, ShieldCheck } from 'lucide-react';
import { EncryptionIndicator } from './EncryptionIndicator';
import { useState } from 'react';

interface Props {
  loginId: string;
  isOnline: boolean;
  encryptionReady?: boolean;
  onBack?: () => void;
}

export function ConversationHeader({ loginId, isOnline, encryptionReady = true, onBack }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex items-center gap-2.5 sm:gap-3.5 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/95 backdrop-blur-md sticky top-0 z-20 flex-shrink-0 safe-top">
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-xl hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] md:hidden cursor-pointer touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
          aria-label="Back to conversations list"
        >
          <ArrowLeft size={22} />
        </button>
      )}

      {/* Recipient Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold text-base shadow-xs select-none">
          {loginId[0]?.toUpperCase() ?? '?'}
        </div>
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--color-bg-primary)] ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      </div>

      {/* Recipient Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] truncate tracking-tight">
            {loginId}
          </span>
          <EncryptionIndicator ready={encryptionReady} />
        </div>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-[var(--color-text-secondary)] font-medium">
          {isOnline ? (
            <span className="text-emerald-500 font-semibold">Active now</span>
          ) : (
            <span>Offline</span>
          )}
        </div>
      </div>

      {/* Action / Security Pill */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
        aria-label="Conversation options"
      >
        <MoreVertical size={18} />
      </button>

      {/* Quick Security modal/sheet if tapped */}
      {showDetails && (
        <div className="absolute top-full left-0 right-0 p-3 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] shadow-lg z-30 animate-in slide-in-from-top-1 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-[var(--color-text-primary)]">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <ShieldCheck size={16} /> End-to-End Encrypted Chat
            </span>
            <button onClick={() => setShowDetails(false)} className="text-[var(--color-text-secondary)] hover:underline">
              Close
            </button>
          </div>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            Messages exchanged with <strong>{loginId}</strong> are encrypted using AES-GCM 256-bit keys generated on this device.
            Only you and {loginId} possess the decryption keys.
          </p>
        </div>
      )}
    </div>
  );
}
