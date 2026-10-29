import { useState } from 'react';
import { Search, UserPlus, Bell, MessageSquarePlus, Shield, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { Conversation } from '../types';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import clsx from 'clsx';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ChatSidebar({ conversations, activeId, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();
  const { mode, toggle } = useThemeStore();
  const navigate = useNavigate();

  const currentUserId = user?.id;

  const filtered = conversations.filter((c) => {
    const other = c.members.find((m) => m.user_id !== currentUserId);
    return other?.login_id.toLowerCase().includes(search.toLowerCase()) ?? false;
  });

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)] relative select-none">
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 border-b border-[var(--color-border)] flex-shrink-0 bg-[var(--color-bg-card)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)] text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
              {(user?.login_id || user?.loginId || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                {user?.login_id || user?.loginId}
              </div>
              <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Online &bull; E2EE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/contacts/requests"
              className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-accent)] active:bg-[var(--color-bg-secondary)] transition-colors"
              title="Contact requests"
              aria-label="Contact requests"
            >
              <Bell size={18} />
            </Link>
            <Link
              to="/contacts/search"
              className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-accent)] active:bg-[var(--color-bg-secondary)] transition-colors"
              title="Find users"
              aria-label="Find users"
            >
              <UserPlus size={18} />
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] rounded-2xl px-3 py-2 border border-[var(--color-border)] focus-within:border-[var(--color-accent)] transition-all shadow-2xs">
          <Search size={16} className="text-[var(--color-text-secondary)] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats…"
            className="flex-1 bg-transparent text-sm outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]/40 overscroll-contain">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-3xl bg-[var(--color-bg-secondary)] flex items-center justify-center text-2xl mb-3 shadow-2xs">
              💬
            </div>
            <p className="text-[var(--color-text-primary)] text-sm font-bold">No chats yet</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs">
              Find another user by their unique Login ID to start an encrypted conversation.
            </p>
            <button
              onClick={() => navigate('/contacts/search')}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-xs font-bold hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <UserPlus size={15} />
              <span>Find Users</span>
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
            const other = conv.members.find((m) => m.user_id !== currentUserId);
            const otherLoginId = other?.login_id ?? 'Unknown';
            const isActive = activeId === conv.id;

            let updatedTime = '';
            try {
              updatedTime = format(new Date(conv.updated_at), 'HH:mm');
            } catch {
              updatedTime = '';
            }

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={clsx(
                  'w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)] transition-all text-left cursor-pointer touch-manipulation',
                  isActive && 'bg-[var(--color-bg-secondary)] border-l-4 border-[var(--color-accent)]'
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-black text-base flex-shrink-0 shadow-2xs">
                  {otherLoginId[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--color-text-primary)] truncate">
                      {otherLoginId}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-secondary)] flex-shrink-0 ml-2 font-medium">
                      {updatedTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[var(--color-text-secondary)] truncate">
                      🔒 End-to-end encrypted
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Floating Action Button on Mobile */}
      <div className="md:hidden absolute bottom-20 right-4 z-20">
        <button
          onClick={() => navigate('/contacts/search')}
          className="w-14 h-14 rounded-full bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          aria-label="Start new chat"
        >
          <MessageSquarePlus size={24} />
        </button>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/95 backdrop-blur-md px-2 py-2 flex items-center justify-around flex-shrink-0 safe-bottom z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center gap-1 py-1 px-3 text-[var(--color-accent)] font-bold text-[10px]"
        >
          <div className="p-1 rounded-xl bg-[var(--color-accent)]/15">
            <span className="text-base leading-none">💬</span>
          </div>
          <span>Chats</span>
        </button>

        <button
          onClick={() => navigate('/contacts/search')}
          className="flex flex-col items-center gap-1 py-1 px-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold text-[10px]"
        >
          <UserPlus size={18} />
          <span>Search</span>
        </button>

        <button
          onClick={() => navigate('/contacts/requests')}
          className="flex flex-col items-center gap-1 py-1 px-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold text-[10px]"
        >
          <Bell size={18} />
          <span>Requests</span>
        </button>

        <button
          onClick={() => navigate('/security')}
          className="flex flex-col items-center gap-1 py-1 px-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold text-[10px]"
        >
          <Shield size={18} />
          <span>Security</span>
        </button>
      </div>
    </div>
  );
}
