import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { devicesApi } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Device } from '../types';
import { ArrowLeft, ShieldCheck, Laptop, Trash2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function SecurityPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await devicesApi.list();
      setDevices(res.data);
    } catch (e) {
      console.error('Failed to load devices', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await devicesApi.revoke(id);
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, revoked_at: new Date().toISOString() } : d))
      );
      toast.success('Device revoked successfully');
    } catch {
      toast.error('Failed to revoke device');
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

        <div className="mb-6">
          <h1 className="text-2xl font-black text-[var(--color-text-primary)]">Security & Devices</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Manage your registered devices and public encryption keys. Private keys remain strictly on your local browser.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 mb-6 flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong>Client-Side Cryptography Active:</strong> Your private keys are stored non-extractably in local IndexedDB.
            The server only stores public identity keys and ciphertext bytes.
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={28} />
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const isRevoked = Boolean(device.revoked_at || device.revokedAt);
              const pubKey = device.identity_public_key || device.identityPublicKey || '';

              return (
                <div
                  key={device.id}
                  className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-secondary)] flex-shrink-0">
                    <Laptop size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--color-text-primary)] truncate">
                        Device {device.id.slice(0, 8)}…
                      </span>
                      {isRevoked ? (
                        <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                          Revoked
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--color-text-secondary)] truncate mt-1 flex items-center gap-1">
                      <KeyRound size={12} />
                      <span>Public Key: {pubKey ? pubKey.slice(0, 24) + '…' : 'None'}</span>
                    </div>
                  </div>

                  {!isRevoked && (
                    <button
                      onClick={() => handleRevoke(device.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Revoke device"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
