import { Navbar } from '../components/Navbar';
import { UserSearch } from '../components/UserSearch';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ContactSearchPage() {
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

        <div className="mb-6">
          <h1 className="text-2xl font-black text-[var(--color-text-primary)]">Find Contacts</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            Search for another user by their exact Login ID. When you find them, you can send a contact request.
            Both parties must accept before an encrypted conversation can begin.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs">
          <UserSearch />
        </div>
      </div>
    </div>
  );
}
