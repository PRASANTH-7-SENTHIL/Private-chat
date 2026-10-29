import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquareLock, Menu, X, Sun, Moon, LogOut, UserPlus, LogIn, MessageSquare } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { wsService } from '../services/websocket';
import { useClickOutside } from '../hooks/useClickOutside';
import clsx from 'clsx';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { mode, toggle } = useThemeStore();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useClickOutside(dropdownRef, () => setLoginDropdownOpen(false));

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    wsService.disconnect();
    clearAuth();
    navigate('/');
  };

  return (
    <nav className={clsx(
      'sticky top-0 z-50 border-b backdrop-blur-md',
      'bg-[var(--color-bg-primary)]/95 border-[var(--color-border)]'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Logo and Project Name */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-[var(--color-accent)] hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
            <MessageSquareLock size={24} />
          </div>
          <span className="tracking-tight text-[var(--color-text-primary)]">Private <span className="text-[var(--color-accent)]">Chat</span></span>
        </Link>

        {/* Right Desktop Nav */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {mode === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)] transition-colors shadow-sm"
              >
                <MessageSquare size={17} />
                <span>Dashboard ({user?.login_id || user?.loginId})</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-sm font-medium transition-colors cursor-pointer text-rose-500"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-colors shadow-sm cursor-pointer"
              >
                <span>Login Chat</span>
              </button>

              {/* Login Chat dropdown menu with the two required options */}
              {loginDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border bg-[var(--color-bg-card)] border-[var(--color-border)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2">
                    <Link
                      to="/register"
                      onClick={() => setLoginDropdownOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                        <UserPlus size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">Option 1: Create New Chat</div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Register a new private account</div>
                      </div>
                    </Link>

                    <div className="my-1 border-t border-[var(--color-border)]" />

                    <Link
                      to="/login"
                      onClick={() => setLoginDropdownOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                        <LogIn size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">Option 2: Login to Your Chat</div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Sign in with your Login ID</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggle}
            className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            aria-label="Toggle theme"
          >
            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-4 space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 px-4 rounded-xl bg-[var(--color-accent)] text-white text-center font-semibold"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full py-2.5 px-4 rounded-xl border border-[var(--color-border)] text-center text-rose-500 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold"
              >
                <UserPlus size={18} />
                <span>Option 1: Create New Chat</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold"
              >
                <LogIn size={18} />
                <span>Option 2: Login to Your Chat</span>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
