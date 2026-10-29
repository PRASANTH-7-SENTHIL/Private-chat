import { useRef, useState } from 'react';
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useClickOutside } from '../hooks/useClickOutside';

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const loginId = user?.login_id || user?.loginId || 'User';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer"
        aria-label="User profile menu"
      >
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold shadow-xs">
          {loginId[0]?.toUpperCase() ?? '?'}
        </div>
        <span className="text-xs font-semibold text-[var(--color-text-primary)] hidden sm:inline max-w-[120px] truncate">
          {loginId}
        </span>
        <ChevronDown size={14} className="text-[var(--color-text-secondary)]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in">
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
            <div className="text-xs font-bold text-[var(--color-text-primary)] truncate">{loginId}</div>
            <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">Authenticated Session</div>
          </div>

          <div className="p-1">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--color-bg-secondary)] text-xs font-medium text-[var(--color-text-primary)] transition-colors"
              onClick={() => setOpen(false)}
            >
              <User size={15} className="text-[var(--color-text-secondary)]" /> Profile
            </Link>
            <Link
              to="/security"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--color-bg-secondary)] text-xs font-medium text-[var(--color-text-primary)] transition-colors"
              onClick={() => setOpen(false)}
            >
              <Shield size={15} className="text-[var(--color-text-secondary)]" /> Security & Keys
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--color-bg-secondary)] text-xs font-medium text-[var(--color-text-primary)] transition-colors"
              onClick={() => setOpen(false)}
            >
              <Settings size={15} className="text-[var(--color-text-secondary)]" /> Appearance
            </Link>
          </div>

          <div className="p-1 border-t border-[var(--color-border)]">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
