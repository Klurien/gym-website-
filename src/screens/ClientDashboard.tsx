import { useState, useEffect } from 'react';
import { Medal, Shield, Flame, Crown, TrendingUp, Zap, BookOpen, ArrowRight } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';

const levelConfig: Record<string, { label: string; color: string; bg: string }> = {
  beginner: { label: 'BEGINNER', color: '#00D26A', bg: 'rgba(0,210,106,0.1)' },
  intermediate: { label: 'INTERMEDIATE', color: '#FFB800', bg: 'rgba(255,184,0,0.1)' },
  advanced: { label: 'ADVANCED', color: '#FF2442', bg: 'rgba(255,36,66,0.1)' },
};

const PROGRAMS = [
  { id: '1', title: 'Foundation Strength', level: 'beginner', price: 0 },
  { id: '2', title: 'Bodyweight Mastery', level: 'beginner', price: 0 },
  { id: '3', title: 'Hypertrophy Accelerator', level: 'intermediate', price: 29 },
  { id: '4', title: 'Power & Explosiveness', level: 'intermediate', price: 39 },
  { id: '5', title: 'Elite Performance', level: 'advanced', price: 79 },
  { id: '6', title: 'Certified Coach', level: 'advanced', price: 149 },
];

export default function ClientDashboard({
  user,
  onShowPayment,
  onViewCourse,
}: {
  user: any;
  onShowPayment: (amount: number, programId?: string, name?: string) => void;
  onViewCourse: (programId: string | number) => void;
}) {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/my-payments', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : []))
      .then(setPayments)
      .catch(() => {});
  }, []);

  const unlocked = PROGRAMS.filter(p => p.price === 0 || user.premium);
  const pct = Math.round((unlocked.length / PROGRAMS.length) * 100);
  const lvl = levelConfig[user.level || 'beginner'];
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'GOOD MORNING' : h < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  };

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header
        className="relative overflow-hidden rounded-[24px] p-6"
        style={{
          background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 40%, #0a0a14 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full opacity-10"
          style={{ background: 'var(--red)' }}
        />
        <div
          className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full opacity-10"
          style={{ background: 'var(--amber)' }}
        />
        <div className="relative z-10">
          <p className="t-label" style={{ color: 'var(--text-3)' }}>
            {greeting()}
          </p>
          <h1
            className="font-anton text-4xl text-white uppercase mt-1"
            style={{ lineHeight: 1 }}
          >
            {user.username}
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <span
              className="badge"
              style={{
                background: lvl.bg,
                color: lvl.color,
                border: `1px solid ${lvl.color}30`,
              }}
            >
              <Medal size={12} /> {lvl.label}
            </span>
            <span
              className="badge"
              style={{
                background: user.premium ? 'var(--amber-soft)' : 'var(--green-soft)',
                color: user.premium ? 'var(--amber)' : 'var(--green)',
                border: `1px solid ${user.premium ? 'var(--amber)' : 'var(--green)'}30`,
              }}
            >
              <Shield size={12} /> {user.premium ? 'PREMIUM' : 'FREE'}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div
          className="rounded-[20px] p-5 relative overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{ background: 'var(--red)', transform: 'translate(30%, -30%)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--red-soft)' }}
              >
                <TrendingUp size={20} style={{ color: 'var(--red)' }} strokeWidth={2.5} />
              </div>
              <span className="t-label" style={{ color: 'var(--text-3)' }}>
                PROGRESS
              </span>
            </div>
            <p className="font-anton text-4xl text-white" style={{ lineHeight: 1 }}>
              {pct}%
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
              {unlocked.length}/{PROGRAMS.length} programs
            </p>
          </div>
        </div>
        <div
          className="rounded-[20px] p-5 relative overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{ background: 'var(--amber)', transform: 'translate(30%, -30%)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--amber-soft)' }}
              >
                <Flame size={20} style={{ color: 'var(--amber)' }} strokeWidth={2.5} />
              </div>
              <span className="t-label" style={{ color: 'var(--text-3)' }}>
                PAYMENTS
              </span>
            </div>
            <p className="font-anton text-4xl text-white" style={{ lineHeight: 1 }}>
              {payments.filter(p => p.status === 'completed').length}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
              completed
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="t-h2 text-white">YOUR PROGRESS</h3>
          <span className="t-label" style={{ color: 'var(--text-3)' }}>
            {unlocked.length} UNLOCKED
          </span>
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing pct={pct} size={64} stroke={6} color="var(--red)" />
          <div className="flex-1 space-y-3">
            {(['beginner', 'intermediate', 'advanced'] as const).map(l => {
              const count = PROGRAMS.filter(p => p.level === l).length;
              const unlockedCount = PROGRAMS.filter(
                p => p.level === l && (p.price === 0 || user.premium)
              ).length;
              const cfg = levelConfig[l];
              return (
                <div key={l} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: cfg.color }}
                  />
                  <span
                    className="t-label flex-1"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {cfg.label}
                  </span>
                  <span className="font-anton text-lg text-white">
                    {unlockedCount}/{count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enrolled courses quick view */}
      {unlocked.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="t-h2 text-white">MY COURSES</h3>
            <button
              onClick={() => onViewCourse(unlocked[0].id)}
              className="text-xs font-bold tracking-wider flex items-center gap-1"
              style={{ color: 'var(--red)' }}
            >
              VIEW ALL <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {unlocked.slice(0, 3).map(p => (
              <button
                key={p.id}
                onClick={() => onViewCourse(p.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:translate-x-1 text-left"
                style={{ background: 'var(--surface-2)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--red-soft)' }}
                >
                  <BookOpen size={18} style={{ color: 'var(--red)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{p.title}</p>
                  <span
                    className="badge mt-1"
                    style={{
                      background: levelConfig[p.level]?.bg || 'var(--surface-2)',
                      color: levelConfig[p.level]?.color || 'var(--text-3)',
                    }}
                  >
                    {p.level}
                  </span>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-3)' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {!user.premium && (
        <div
          className="relative overflow-hidden rounded-[20px] p-6 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(255,36,66,0.15), rgba(255,184,0,0.08))',
            border: '1px solid rgba(255,36,66,0.25)',
          }}
        >
          <div
            className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full"
            style={{ background: 'rgba(255,36,66,0.1)' }}
          />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <Crown size={20} style={{ color: 'var(--amber)' }} />
              <span className="t-label" style={{ color: 'var(--amber)' }}>
                UPGRADE
              </span>
            </div>
            <h3 className="font-anton text-2xl text-white uppercase">
              UNLOCK ALL PROGRAMS
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Get access to intermediate & advanced training plans
            </p>
            <button
              onClick={() => onShowPayment(29, '', 'All Programs')}
              className="btn mt-2"
            >
              <Zap size={16} strokeWidth={3} /> UPGRADE FROM KES 29
            </button>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="card space-y-4">
          <h3 className="t-h2 text-white">RECENT PAYMENTS</h3>
          <div className="space-y-2">
            {payments.slice(0, 3).map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--surface-2)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {p.program_name || 'PREMIUM UNLOCK'}
                  </p>
                  <p className="t-label mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="font-anton text-lg"
                  style={{
                    color: p.status === 'completed' ? 'var(--green)' : 'var(--amber)',
                  }}
                >
                  KES {p.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
