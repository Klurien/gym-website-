import React from 'react';

export default function Notifications() {
  const notifications = [
    { type: 'like', text: 'Coach Alex Rivers liked your morning HIIT session.', time: '2m ago', icon: 'favorite' },
    { type: 'call', text: 'Missed Elite Call from Performance Lab.', time: '1h ago', icon: 'call_missed' },
    { type: 'comment', text: 'Coach Alex Rivers replied to your form check query.', time: '3h ago', icon: 'chat' },
    { type: 'system', text: 'Global Leaderboard updated. You are now #128.', time: '5h ago', icon: 'military_tech' },
    { type: 'like', text: 'Your transform clip is trending in the Global Feed.', time: '12h ago', icon: 'bolt' },
  ];

  return (
    <main className="pt-32 pb-32 px-6 max-w-lg mx-auto space-y-8">
      <header className="space-y-1 ml-2">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Activity</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Elite Interactions</p>
      </header>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <div key={i} className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex items-start gap-5 hover:bg-zinc-900/60 transition-all cursor-pointer group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              n.type === 'like' ? 'bg-red-500/10 text-red-500 shadow-red-500/5' :
              n.type === 'call' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/5' :
              n.type === 'comment' ? 'bg-lime-400/10 text-lime-400 shadow-lime-400/5' :
              'bg-blue-500/10 text-blue-500 shadow-blue-500/5'
            }`}>
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">{n.icon}</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-white leading-relaxed">{n.text}</p>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">{n.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-10 flex flex-col items-center text-center space-y-4">
         <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center text-zinc-700">
            <span className="material-symbols-outlined">history</span>
         </div>
         <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">End of Recent Activity</p>
      </div>
    </main>
  );
}
