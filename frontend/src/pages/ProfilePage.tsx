import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Copy, Check, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const loginId = user?.login_id || user?.loginId || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(loginId);
    setCopied(true);
    toast.success('Login ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10 w-full flex-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <h1 className="text-2xl font-black text-[var(--color-text-primary)] mb-6">User Profile</h1>

        <div className="rounded-3xl border border-[var(--color-border)] p-6 bg-[var(--color-bg-card)] shadow-xs space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)] text-white flex items-center justify-center font-black text-2xl shadow-md">
              {loginId[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="text-lg font-black text-[var(--color-text-primary)]">{loginId}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Primary Account ID</div>
            </div>
          </div>

          <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-4 border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Your Public Login ID
              </div>
              <div className="font-mono text-sm font-bold text-[var(--color-accent)] mt-0.5 select-all">
                {loginId}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-secondary)] text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Status:</span>
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <ShieldCheck size={14} /> Active & Verified
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">End-to-End Encryption:</span>
              <span className="font-semibold text-[var(--color-text-primary)]">Enabled (AES-GCM / ECDH)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Password Hash:</span>
              <span className="font-mono text-[var(--color-text-secondary)]">Argon2id (Protected)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
