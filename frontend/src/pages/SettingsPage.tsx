import { Navbar } from '../components/Navbar';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const { mode, setMode } = useThemeStore();
  const navigate = useNavigate();

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

        <h1 className="text-2xl font-black text-[var(--color-text-primary)] mb-6">Settings</h1>

        <div className="rounded-3xl border border-[var(--color-border)] p-6 bg-[var(--color-bg-card)] shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">Theme & Appearance</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Select your preferred visual style. Settings are automatically saved.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('light')}
                className={`flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  mode === 'light'
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-xs'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                <Sun size={18} />
                <span>Light Theme</span>
              </button>

              <button
                onClick={() => setMode('dark')}
                className={`flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  mode === 'dark'
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-xs'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                <Moon size={18} />
                <span>Dark Theme</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
