interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmationDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  danger = false,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-[var(--color-border)]">
        <h3 className="text-lg font-bold mb-2 text-[var(--color-text-primary)]">{title}</h3>
        <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors cursor-pointer ${
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
