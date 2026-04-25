import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <main className="pt-32 pb-32 px-6 max-w-lg mx-auto space-y-10">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-2 border-lime-400 p-1 shadow-[0_0_50px_rgba(204,255,0,0.2)]">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
              className="w-full h-full rounded-full bg-zinc-800 object-cover" 
              alt="Profile" 
            />
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-lime-400">
            <span className="material-symbols-outlined text-sm">verified</span>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{user.username}</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">{user.role === 'admin' ? 'Elite Coach' : 'Global Athlete'}</p>
        </div>
      </div>

      {/* Elite Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Elite Days', value: '42', icon: 'bolt' },
          { label: 'Engagement', value: 'Level 4', icon: 'rebase' },
          { label: 'Global Rank', value: '#128', icon: 'military_tech' },
          { label: 'Sessions', value: '156', icon: 'fitness_center' }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-lime-400/20 transition-all">
            <span className="material-symbols-outlined text-lime-400/50 mb-3 group-hover:scale-110 transition-transform">{stat.icon}</span>
            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Actions Section */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] ml-2">Personal Settings</h2>
        
        <div className="bg-zinc-900/30 rounded-[32px] border border-white/5 overflow-hidden">
          {[
            { label: 'Membership Level', icon: 'payments', value: 'Premium' },
            { label: 'Privacy & Security', icon: 'lock', value: 'Direct' },
            { label: 'Global Language', icon: 'language', value: 'English' }
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all text-left border-b border-white/5 last:border-0">
               <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-zinc-500">{item.icon}</span>
                  <span className="text-sm font-bold text-white">{item.label}</span>
               </div>
               <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{item.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-5 rounded-3xl uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-red-500/5"
      >
        Terminate Session
      </button>

      <p className="text-center text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Kinetic Global v4.0.2</p>
    </main>
  );
}
