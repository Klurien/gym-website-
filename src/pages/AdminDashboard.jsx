import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalLikes: 0, unreadMessages: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/feed');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/analytics', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    // Consider online if seen in the last 2 minutes
    return (now - lastSeenDate) < 120000;
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diff = Math.floor((now - lastSeenDate) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <main className="pt-32 pb-32 px-6 max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter hover:text-lime-400 transition-colors">Command Center</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Global Coach Insights</p>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Global Clients', value: stats.totalUsers || 0, icon: 'groups', color: 'lime' },
          { label: 'Feed Engagement', value: stats.totalLikes || 0, icon: 'favorite', color: 'sky' },
          { label: 'Active Requests', value: stats.unreadMessages || 0, icon: 'chat', color: 'amber' }
        ].map((met, i) => (
          <div key={i} className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all group cursor-default">
            <div className={`w-12 h-12 rounded-2xl bg-${met.color}-400/10 flex items-center justify-center text-${met.color}-400 mb-6 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-3xl">{met.icon}</span>
            </div>
            <h3 className="text-3xl font-black text-white">{met.value}</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{met.label}</p>
          </div>
        ))}
      </div>

      {/* Advanced Control Panel */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="material-symbols-outlined text-[120px] text-lime-400">monitoring</span>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Growth Velocity
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
          </h2>
          <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden">
             <div className="h-full bg-lime-400 animate-pulse" style={{ width: '65%' }}></div>
          </div>
          <p className="text-sm text-zinc-400 font-body-md leading-relaxed">
            Your global brand footprint is expanding. Message volume has increased by 15% this week. Maintain current engagement to reach Tier-1 Coach status.
          </p>
          <div className="flex gap-4 pt-4">
            <button onClick={() => navigate('/messages')} className="bg-lime-400 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(163,230,53,0.3)] hover:scale-105 active:scale-95 transition-all">
              Manage Conversations
            </button>
            <button onClick={() => navigate('/feed')} className="bg-zinc-800 text-zinc-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all ring-1 ring-white/5 hover:ring-white/10">
              View Public Brand
            </button>
          </div>
        </div>
      </div>

      {/* Client Access Log */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-lg font-black text-white uppercase tracking-tight">Client Activity</h2>
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Live Metrics</span>
             <button onClick={fetchData} className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-zinc-500">
               <span className="material-symbols-outlined text-[14px]">refresh</span>
             </button>
           </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
           {users.length === 0 ? (
             <div className="text-center py-10 bg-zinc-900/20 rounded-3xl border border-dashed border-white/5">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No clients registered yet</p>
             </div>
           ) : (
             users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-5 bg-zinc-900/30 rounded-3xl border border-white/5 hover:bg-zinc-900/50 hover:border-white/10 transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden relative border border-white/10">
                       <img src={u.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" alt={u.username} />
                       {isOnline(u.last_seen) && (
                         <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-lime-400 border-2 border-zinc-900 rounded-full shadow-[0_0_10px_rgba(163,230,53,0.5)]"></div>
                       )}
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                         <h4 className="text-sm font-bold text-white group-hover:text-lime-400 transition-colors uppercase tracking-tight">{u.username}</h4>
                         {u.role === 'admin' && <span className="bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">Admin</span>}
                       </div>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                         {u.email} • Active {formatLastSeen(u.last_seen)}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/messages?with=${u.id}`)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:bg-lime-400 hover:text-black transition-all">
                       <span className="material-symbols-outlined text-xl">chat</span>
                    </button>
                    {isOnline(u.last_seen) ? (
                      <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest bg-lime-400/5 px-4 py-2 rounded-xl border border-lime-400/20">Online</span>
                    ) : (
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5">Offline</span>
                    )}
                 </div>
              </div>
            ))
           )}
        </div>
      </section>
    </main>
  );
}
