import { useState, useEffect } from 'react';
import { CheckCircle, X, Crown, Clock } from 'lucide-react';

export default function PaymentConfirmedModal({ user }: { user: any }) {
  const [confirmed, setConfirmed] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const check = () => {
      fetch('/api/payments/recent-confirmed', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => (r.ok ? r.json() : []))
        .then((list) => {
          const unseen = list.filter((p: any) => !dismissed.has(p.reference || p.id));
          if (unseen.length) setConfirmed(prev => {
            const existing = new Set(prev.map(p => p.reference || p.id));
            const newOnes = unseen.filter((p: any) => !existing.has(p.reference || p.id));
            return [...newOnes, ...prev];
          });
        })
        .catch(() => {});
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = (ref: string) => {
    setDismissed(prev => new Set(prev).add(ref));
    setConfirmed(prev => prev.filter(p => (p.reference || p.id) !== ref));
  };

  if (confirmed.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <div className="absolute bottom-24 right-4 sm:right-6 space-y-3 pointer-events-auto max-w-sm w-full">
        {confirmed.map((p) => (
          <div
            key={p.reference || p.id}
            className="rounded-[20px] p-5 animate-slide-up shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #0d1a0d 0%, #0a0a0a 100%)',
              border: '1px solid rgba(0,210,106,0.3)',
              boxShadow: '0 8px 32px rgba(0,210,106,0.15)',
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--green-soft)' }}
              >
                <CheckCircle size={24} style={{ color: 'var(--green)' }} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-anton text-base text-white uppercase">CONFIRMED</h4>
                  <button
                    onClick={() => dismiss(p.reference || p.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <X size={14} style={{ color: 'var(--text-3)' }} />
                  </button>
                </div>
                <p className="text-sm font-bold text-white mt-1">
                  Your payment of KES {p.amount} has been confirmed by admin!
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Crown size={12} style={{ color: 'var(--amber)' }} />
                    <span className="t-label" style={{ color: 'var(--amber)' }}>
                      {p.program_name || 'PREMIUM'}
                    </span>
                  </div>
                  {p.confirmed_at && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: 'var(--text-3)' }} />
                      <span className="t-label" style={{ color: 'var(--text-3)' }}>
                        {new Date(p.confirmed_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
