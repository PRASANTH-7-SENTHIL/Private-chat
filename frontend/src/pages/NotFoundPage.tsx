import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-8xl font-black text-[var(--color-accent)] mb-2 tracking-tighter">404</div>
        <h1 className="text-2xl font-black text-[var(--color-text-primary)] mb-2">Page Not Found</h1>
        <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mb-8 leading-relaxed">
          The requested path does not exist or has been moved. Check the URL or return to home.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--color-accent)] text-white text-xs font-bold hover:bg-[var(--color-accent-hover)] transition-all shadow-md shadow-[var(--color-accent)]/20 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
