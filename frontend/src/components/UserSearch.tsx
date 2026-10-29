import { useState } from 'react';
import { Search, UserPlus, Loader2, Check } from 'lucide-react';
import { usersApi, contactsApi } from '../services/api';
import { ErrorMessage } from './ErrorMessage';
import type { User } from '../types';
import toast from 'react-hot-toast';

export function UserSearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSent(false);
    try {
      const res = await usersApi.search(query.trim());
      setResult(res.data as User);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'No user found with this Login ID');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!result) return;
    setSending(true);
    try {
      await contactsApi.sendRequest(result.id);
      setSent(true);
      toast.success('Contact request sent successfully!');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2.5 bg-[var(--color-bg-secondary)] rounded-2xl px-4 py-3 border border-[var(--color-border)] focus-within:border-[var(--color-accent)] transition-colors">
          <Search size={18} className="text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter unique Login ID (e.g. user_abc123)…"
            className="flex-1 bg-transparent text-sm outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-3 rounded-2xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {result && (
        <div className="flex items-center gap-3.5 p-4 border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-card)] shadow-xs animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-bold text-lg">
            {(result.login_id || result.loginId || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-[var(--color-text-primary)] truncate">
              {result.login_id || result.loginId}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              Status: <span className="text-emerald-500 font-medium">Active</span>
            </div>
          </div>
          <button
            onClick={handleSendRequest}
            disabled={sent || sending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              sent
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-300 dark:border-emerald-800'
                : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-xs'
            }`}
          >
            {sent ? (
              <>
                <Check size={14} /> Request Sent
              </>
            ) : sending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                <UserPlus size={14} /> Connect
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
