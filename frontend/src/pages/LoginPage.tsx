import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.login({
        login_id: loginId.trim(),
        password,
      });

      setAuth(data.user, data.device_id, data.access_token);
      toast.success(`Welcome back, ${data.user.login_id || data.user.loginId}!`);
      navigate('/dashboard');
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError('Too many login attempts. Please wait a minute before trying again.');
      } else {
        // Generic error message to prevent account enumeration
        setError('Invalid Login ID or password. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-[var(--color-border)] p-8 bg-[var(--color-bg-card)] shadow-xl">
          <div className="mb-6">
            <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider">Option 2</span>
            <h1 className="text-2xl font-black text-[var(--color-text-primary)] mt-1">Login to Your Chat</h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Enter your unique Login ID and password to access your encrypted chats.
            </p>
          </div>

          {error && <div className="mb-5"><ErrorMessage message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Login ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter your Login ID"
                required
                autoComplete="username"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-[var(--color-accent)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !loginId.trim() || !password}
              className="w-full py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-bold text-sm hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all shadow-md shadow-[var(--color-accent)]/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size={18} />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-[var(--color-accent)] font-semibold hover:underline">
              Option 1: Create New Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
