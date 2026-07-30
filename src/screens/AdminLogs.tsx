import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, ShieldAlert, Search, Filter, Clock, User, DollarSign, LogIn, CreditCard } from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  payment_init: CreditCard,
  payment_complete: DollarSign,
  registration: LogIn,
};

const TYPE_COLORS: Record<string, string> = {
  payment_init: 'var(--amber)',
  payment_complete: 'var(--green)',
  registration: 'var(--red)',
};

const TYPE_BG: Record<string, string> = {
  payment_init: 'var(--amber-soft)',
  payment_complete: 'var(--green-soft)',
  registration: 'var(--red-soft)',
};

export default function AdminLogs({ user }: { user: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/admin/logs?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : []))
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [typeFilter, statusFilter]);

  const handleAction = async (id: number, action: 'confirm' | 'flag') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/logs/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchLogs();
    } catch {}
  };

  const filtered = search
    ? logs.filter(l =>
        (l.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.reference || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-32 space-y-6 animate-fade-in">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-soft)' }}>
            <ClipboardList size={22} style={{ color: 'var(--red)' }} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="t-h1 text-white">ACTIVITY LOGS</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
              Review and confirm all platform activity
            </p>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: 'var(--text-3)' }} />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="field !w-auto !min-w-[140px]"
          >
            <option value="">ALL TYPES</option>
            <option value="payment_init">PAYMENT INIT</option>
            <option value="payment_complete">PAYMENT COMPLETE</option>
            <option value="registration">REGISTRATION</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="field !w-auto !min-w-[140px]"
          >
            <option value="">ALL STATUS</option>
            <option value="pending">PENDING</option>
            <option value="confirmed">CONFIRMED</option>
            <option value="flagged">FLAGGED</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-3 border-[var(--red)] border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--surface-2)' }}>
            <ClipboardList size={28} style={{ color: 'var(--text-3)' }} strokeWidth={1.5} />
          </div>
          <p className="font-anton text-2xl text-white uppercase">NO LOGS FOUND</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Activity will appear here as users interact</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log: any) => {
            const Icon = TYPE_ICONS[log.type] || Clock;
            const iconColor = TYPE_COLORS[log.type] || 'var(--text-3)';
            const iconBg = TYPE_BG[log.type] || 'var(--surface-2)';

            return (
              <div
                key={log.id}
                className="card flex items-start gap-4 p-4 transition-all"
                style={{
                  borderColor: log.status === 'flagged' ? 'rgba(255,36,66,0.3)' : log.status === 'confirmed' ? 'rgba(0,210,106,0.3)' : 'var(--border)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: iconBg }}
                >
                  <Icon size={18} style={{ color: iconColor }} strokeWidth={2} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="t-label" style={{ color: iconColor }}>{log.type?.replace('_', ' ')}</span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider"
                      style={{
                        background: log.status === 'confirmed' ? 'var(--green-soft)' : log.status === 'flagged' ? 'var(--red-soft)' : 'var(--surface-2)',
                        color: log.status === 'confirmed' ? 'var(--green)' : log.status === 'flagged' ? 'var(--red)' : 'var(--text-3)',
                      }}
                    >
                      {log.status === 'pending' && <Clock size={10} />}
                      {log.status === 'confirmed' && <CheckCircle size={10} />}
                      {log.status === 'flagged' && <ShieldAlert size={10} />}
                      {log.status?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1 break-words">{log.description}</p>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {log.username && (
                      <div className="flex items-center gap-1.5">
                        <User size={11} style={{ color: 'var(--text-3)' }} />
                        <span className="t-label" style={{ color: 'var(--text-2)' }}>{log.username}</span>
                      </div>
                    )}
                    {log.amount && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={11} style={{ color: 'var(--text-3)' }} />
                        <span className="t-label" style={{ color: 'var(--text-2)' }}>KES {log.amount}</span>
                      </div>
                    )}
                    {log.reference && (
                      <span className="t-label" style={{ color: 'var(--text-3)' }}>REF: {log.reference}</span>
                    )}
                    <span className="t-label" style={{ color: 'var(--text-3)' }}>
                      {new Date(log.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {log.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(log.id, 'confirm')}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-wider transition-all hover:scale-105 min-h-[36px]"
                      style={{ background: 'var(--green-soft)', color: 'var(--green)', border: '1px solid rgba(0,210,106,0.2)' }}
                    >
                      <CheckCircle size={12} /> CONFIRM
                    </button>
                    <button
                      onClick={() => handleAction(log.id, 'flag')}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-wider transition-all hover:scale-105 min-h-[36px]"
                      style={{ background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid rgba(255,36,66,0.2)' }}
                    >
                      <ShieldAlert size={12} /> FLAG
                    </button>
                  </div>
                )}

                {log.status === 'confirmed' && log.confirmed_at && (
                  <div className="text-right shrink-0">
                    <span className="t-label" style={{ color: 'var(--green)' }}>CONFIRMED</span>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {new Date(log.confirmed_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                {log.status === 'flagged' && (
                  <div className="text-right shrink-0">
                    <span className="t-label" style={{ color: 'var(--red)' }}>FLAGGED</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
