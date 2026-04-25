import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, messages: 0, posts: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/feed');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-32 pb-32 px-6 max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Command Center</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Global Coach Insights</p>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Global Clients', value: stats.totalUsers || 0, icon: 'groups', color: 'lime' },
          { label: 'Feed Engagement', value: stats.totalLikes || 0, icon: 'favorite', color: 'sky' },
          { label: 'Active Requests', value: stats.unreadMessages || 0, icon: 'chat', color: 'amber' }
        ].map((met, i) => (
          <div key={i} className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all group">
            <div className={`w-12 h-12 rounded-2xl bg-${met.color}-400/10 flex items-center justify-center text-${met.color}-400 mb-6 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-3xl">{met.icon}</span>
            </div>
            <h3 className="text-3xl font-black text-white">{met.value}</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{met.label}</p>
          </div>
        ))}
      </div>

      {/* Advanced Control Panel */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <span className="material-symbols-outlined text-[120px] text-lime-400">monitoring</span>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Growth Velocity</h2>
          <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden">
             <div className="h-full bg-lime-400 animate-pulse" style={{ width: '65%' }}></div>
          </div>
          <p className="text-sm text-zinc-400 font-body-md leading-relaxed">
            Your global brand footprint is expanding. Message volume has increased by 15% this week. Maintain current engagement to reach Tier-1 Coach status.
          </p>
          <div className="flex gap-4 pt-4">
            <button onClick={() => navigate('/messages')} className="bg-lime-400 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
              Manage Conversations
            </button>
            <button onClick={() => navigate('/feed')} className="bg-zinc-800 text-zinc-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all">
              View Public Brand
            </button>
          </div>
        </div>
      </div>

      {/* Client Access Log */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-lg font-black text-white uppercase tracking-tight">Client Activity</h2>
           <button className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-lime-400">View All Insights</button>
        </div>
        <div className="space-y-3">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex items-center justify-between p-5 bg-zinc-900/30 rounded-2xl border border-white/5 hover:bg-zinc-900/50 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Client${i}`} className="w-full h-full" alt="Client" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-white">Client #{i+1024}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active 2m ago</p>
                   </div>
                </div>
                <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">Connected</span>
             </div>
           ))}
        </div>
      </section>
    </main>
  );
}
