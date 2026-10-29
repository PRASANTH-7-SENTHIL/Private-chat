import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ContactRequestCard } from '../components/ContactRequestCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { contactsApi, conversationsApi } from '../services/api';
import type { ContactRequest } from '../types';
import { ArrowLeft, Inbox, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await contactsApi.getRequests();
      setRequests((res.data as ContactRequest[]).filter((r) => r.status === 'pending'));
    } catch (e) {
      console.error('Failed to load contact requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await contactsApi.acceptRequest(id);
      const req = requests.find((r) => r.id === id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success('Contact request accepted!');

      // Automatically create or fetch the direct conversation
      if (req) {
        try {
          await conversationsApi.create(req.sender_id);
          toast.success('Conversation unlocked!');
        } catch {
          // ignore
        }
      }
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await contactsApi.rejectRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success('Request rejected');
    } catch {
      toast.error('Failed to reject request');
    }
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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-text-primary)]">Contact Requests</h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Pending requests from users who want to chat with you.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-semibold hover:bg-[var(--color-accent)] hover:text-white transition-colors cursor-pointer"
          >
            <MessageSquare size={14} />
            <span>Open Chats</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={28} />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center text-2xl mx-auto mb-3">
              <Inbox size={26} className="text-[var(--color-text-secondary)]" />
            </div>
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">No Pending Requests</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs mx-auto">
              You're all caught up! When other users search your Login ID and request to connect, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <ContactRequestCard
                key={r.id}
                request={r}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
