import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Copy, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { authApi, devicesApi } from '../services/api';
import { encryptionService } from '../services/encryption';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

function evaluatePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-emerald-600',
  ];

  return { score, label: labels[score] || 'Too short', color: colors[score] || 'bg-slate-300' };
}

export function RegisterPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredResult, setRegisteredResult] = useState<{ loginId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const strength = evaluatePassword(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      // 1. Register user on backend (Argon2id hashed on server)
      const payload: { password: string; login_id?: string } = { password };
      if (loginId.trim()) {
        payload.login_id = loginId.trim();
      }

      const { data } = await authApi.register(payload);
      const user = data.user;
      const accessToken = data.access_token;

      // 2. Generate local E2EE keys on client device
      const { publicKey: identityPublicKey } = await encryptionService.generateIdentityKeys();
      const { signedPrekey, signature } = await encryptionService.generateSignedPrekey();

      // Temporarily store token for device registration
      setAuth(user, null, accessToken);

      // 3. Register device's public key material with backend (private key never leaves device!)
      const deviceRes = await devicesApi.register({
        identity_public_key: identityPublicKey,
        signed_prekey: signedPrekey,
        signed_prekey_signature: signature,
      });

      const registeredDeviceId = deviceRes.data.id;
      setAuth(user, registeredDeviceId, accessToken);

      setRegisteredResult({ loginId: user.login_id || user.loginId });
      toast.success('Secure account created successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Registration failed. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (registeredResult) {
      navigator.clipboard.writeText(registeredResult.loginId);
      setCopied(true);
      toast.success('Login ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (registeredResult) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
          <div className="rounded-3xl border border-[var(--color-border)] p-8 bg-[var(--color-bg-card)] shadow-xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <ShieldCheck size={32} />
            </div>

            <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-2">Account Created!</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Your device encryption keys have been generated locally. Save your unique Login ID below:
            </p>

            <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-5 mb-6 border border-[var(--color-border)]">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                Your Unique Login ID
              </div>
              <div className="font-mono font-black text-xl text-[var(--color-accent)] break-all select-all">
                {registeredResult.loginId}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-sm font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Login ID'}</span>
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[var(--color-accent)] text-white text-sm font-bold hover:bg-[var(--color-accent-hover)] transition-all shadow-md shadow-[var(--color-accent)]/20 cursor-pointer"
              >
                <span>Proceed to Chat Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12 w-full flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-[var(--color-border)] p-8 bg-[var(--color-bg-card)] shadow-xl">
          <div className="mb-6">
            <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider">Option 1</span>
            <h1 className="text-2xl font-black text-[var(--color-text-primary)] mt-1">Create New Chat</h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Create your account with a custom or auto-generated Login ID.
            </p>
          </div>

          {error && <div className="mb-5"><ErrorMessage message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Login ID
                </label>
                <span className="text-[11px] text-[var(--color-text-secondary)]">Optional (auto-generated if empty)</span>
              </div>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Leave blank for auto-generated ID"
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
                  placeholder="Minimum 8 characters"
                  required
                  autoComplete="new-password"
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

              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all ${
                          i < strength.score ? strength.color : 'bg-[var(--color-border)]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] flex justify-between">
                    <span>Password strength:</span>
                    <span className="font-semibold">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors"
              />
              {confirmPassword && password !== confirmPassword && (
                <div className="text-[11px] text-rose-500 mt-1 font-medium">Passwords do not match</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (confirmPassword ? password !== confirmPassword : false)}
              className="w-full py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-bold text-sm hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all shadow-md shadow-[var(--color-accent)]/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size={18} />
                  <span>Generating Keys & Registering…</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-accent)] font-semibold hover:underline">
              Option 2: Login to Your Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
