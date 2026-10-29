import { Link } from 'react-router-dom';
import { Shield, Zap, Lock, Key, ArrowRight, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-semibold mb-6 border border-[var(--color-accent)]/20 animate-in fade-in">
            <Shield size={14} />
            <span>Real Client-Side End-to-End Encryption & Native WebSockets</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
            Private, Instant Messaging <br />
            <span className="text-[var(--color-accent)]">Without Surveillance.</span>
          </h1>

          <p className="text-base sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Communicate securely using unique Login IDs, client-side AES-GCM / ECDH cryptography,
            and real-time WebSocket transport. Plaintext messages never touch our servers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[var(--color-accent)] text-white font-bold text-base hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/25 cursor-pointer"
            >
              <UserPlus size={19} />
              <span>Option 1: Create New Chat</span>
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl border-2 border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] font-bold text-base transition-all cursor-pointer"
            >
              <LogIn size={19} />
              <span>Option 2: Login to Your Chat</span>
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Argon2id Hashing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Single-Use WS Tickets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Zero Plaintext Storage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>No Phone Numbers Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/40 flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-7 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center mb-5">
                <Lock size={22} />
              </div>
              <h3 className="font-bold text-lg mb-2">Real End-to-End Encryption</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Messages are encrypted locally on the sender's device using cryptographic keys stored only in browser storage.
                The PostgreSQL database stores only ciphertext payloads.
              </p>
            </div>

            <div className="p-7 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center mb-5">
                <Zap size={22} />
              </div>
              <h3 className="font-bold text-lg mb-2">Native WebSockets & Presence</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Fast bidirectional messaging with message acknowledgements, delivered/read receipts, live online presence,
                automatic reconnect backoff, and offline synchronization.
              </p>
            </div>

            <div className="p-7 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center mb-5">
                <Key size={22} />
              </div>
              <h3 className="font-bold text-lg mb-2">Privacy & Unique Login IDs</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                No phone numbers, emails, or personal data collected. Connect anonymously through unique Login IDs with
                contact request approval protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-text-secondary)]">
        Private Chat &copy; {new Date().getFullYear()} &mdash; Production Real-Time Encrypted Messaging
      </footer>
    </div>
  );
}
