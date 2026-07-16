import { useState, useEffect } from 'react';
import { Users, Dumbbell, DollarSign, TrendingUp, Zap, Trophy, ArrowUpRight } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import BarChart from '../components/ui/BarChart';
import ProgressRing from '../components/ui/ProgressRing';

export default function TrainerDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'GOOD MORNING' : h < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24 pt-28">
        <div
          className="w-8 h-8 border-3 border-[var(--red)] border-t-transparent rounded-full animate-spin"
          style={{ borderWidth: 3 }}
        />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-32 space-y-6 animate-fade-in">
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
            {user.username || 'COACH'}
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
            Here's your business overview
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        <StatCard
          label="CLIENTS"
          value={stats?.totalClients || 0}
          icon={Users}
          color="var(--red)"
          bg="var(--surface)"
        />
        <StatCard
          label="REVENUE"
          value={stats?.totalRevenue || 0}
          icon={DollarSign}
          color="var(--green)"
          bg="var(--surface)"
          prefix="K"
        />
        <StatCard
          label="SALES"
          value={stats?.totalPayments || 0}
          icon={TrendingUp}
          color="var(--amber)"
          bg="var(--surface)"
        />
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="t-h2 text-white">PROGRAM PERFORMANCE</h3>
          <Zap size={18} style={{ color: 'var(--amber)' }} />
        </div>
        {stats?.programStats?.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <BarChart
              data={stats.programStats.map((p: any) => ({
                label: p.title.split(' ')[0],
                value: p.unlock_count,
                color:
                  p.level === 'beginner'
                    ? '#00D26A'
                    : p.level === 'intermediate'
                      ? '#FFB800'
                      : '#FF2442',
              }))}
            />
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="t-label" style={{ color: 'var(--text-3)' }}>
              NO DATA YET
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="t-h2 text-white">BY LEVEL</h3>
          <Dumbbell size={18} style={{ color: 'var(--red)' }} />
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing
            pct={
              stats?.programStats
                ? Math.min(
                    (stats.programStats.reduce(
                      (a: number, p: any) => a + p.unlock_count,
                      0
                    ) /
                      Math.max(stats.totalPayments, 1)) *
                      100,
                    100
                  )
                : 0
            }
            size={64}
            stroke={6}
          />
          <div className="flex-1 space-y-3">
            {[
              ['beginner', '#00D26A', 'BEGINNER'],
              ['intermediate', '#FFB800', 'INTERMEDIATE'],
              ['advanced', '#FF2442', 'ADVANCED'],
            ].map(([level, color, label]) => {
              const count =
                stats?.programStats
                  ?.filter((p: any) => p.level === level)
                  .reduce((a: number, p: any) => a + p.unlock_count, 0) || 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: color }}
                  />
                  <span
                    className="t-label flex-1"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {label}
                  </span>
                  <span className="font-anton text-lg text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="t-h2 text-white">RECENT PAYMENTS</h3>
          <Trophy size={18} style={{ color: 'var(--green)' }} />
        </div>
        {stats?.recentPayments?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentPayments.map((p: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl transition-all hover:translate-x-1"
                style={{ background: 'var(--surface-2)' }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-anton text-lg text-white shrink-0"
                  style={{ background: 'var(--red)' }}
                >
                  {p.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {p.username || 'UNKNOWN'}
                  </p>
                  <p className="t-label mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>
                    {p.program_name || 'PREMIUM'}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2 shrink-0">
                  <div>
                    <p
                      className="font-anton text-lg"
                      style={{ color: 'var(--green)', lineHeight: 1 }}
                    >
                      KES {p.amount}
                    </p>
                    <p className="t-label mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {p.status}
                    </p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: 'var(--green)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="t-label" style={{ color: 'var(--text-3)' }}>
              NO PAYMENTS YET
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
