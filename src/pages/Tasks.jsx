import React, { useState, useEffect } from 'react';

export default function Tasks() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ calories: 0, streak: 12, volume: '8.2t', sleep: '7h' });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/workouts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        
        // Calculate total calories from logs
        const _calc = (data.logs || []).reduce((acc, log) => acc + (log.calories_burned || 0), 0);
        if (_calc > 0) {
           setStats(prev => ({ ...prev, calories: _calc }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="pt-32 pb-32 px-edge-margin space-y-stack-lg max-w-5xl mx-auto">
      {/* Header Section */}
      <section className="flex flex-col gap-2">
        <h2 className="font-display-xl text-display-xl text-primary tracking-tighter">DAILY TASKS</h2>
        <div className="flex items-center gap-3">
          <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-lime-500 to-lime-300 w-[65%]"></div>
          </div>
          <span className="font-label-bold text-label-bold text-lime-400">65% DONE</span>
        </div>
      </section>

      {/* Bento Grid Tasks */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {/* High Priority Task */}
        <div className="bg-zinc-900/50 p-container-padding rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-lime-400/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="bg-lime-400/10 text-lime-400 text-[10px] font-black px-2 py-1 rounded-full border border-lime-400/20 uppercase tracking-widest">High Energy</span>
              <h3 className="font-headline-md text-headline-md text-primary mt-2 uppercase">Leg Day Session</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-lime-400 flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.4)]">
              <span className="material-symbols-outlined text-black font-bold">fitness_center</span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-zinc-400 mb-6">Heavy squats & deadlifts. Focus on explosive power and form.</p>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden">
                <img className="w-full h-full object-cover" alt="Athlete" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuNtPePjL4zkxIhCKuNs175WACc-Pn5VP0KvbRTJ-peHSKzXE3DBx92KwGXEIlO2WfKSn-dzwh0NVQxJJvG2i7ZBGhdp6glYOds-Pj7jq2-J9usAXSBxJxnPw2jRGRaqj_lwdGx_2f3bdjh5gCPvMG_vUtdoeKuTYWZvd-NavFIrh1U45EndxpkYU-eBzGiNVR2sBDTUANQXSw70ZN4O-wQuqyy_YxL6dCqHxyJI5M1P9P3sRG0gC7AlIhj4FxDQartMYz8keiLWs3" />
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center font-label-sm text-lime-400">+3</div>
            </div>
            <button className="bg-lime-400 text-black font-label-bold text-label-bold px-6 py-2 rounded-full hover:scale-105 active:scale-95 transition-all">COMPLETE</button>
          </div>
        </div>

        {/* Focus Task */}
        <div className="bg-zinc-900/50 p-container-padding rounded-[24px] border border-white/5 shadow-2xl group hover:border-lime-400/50 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-2 py-1 rounded-full border border-white/5 uppercase tracking-widest">Nutrition</span>
              <h3 className="font-headline-md text-headline-md text-primary mt-2 uppercase">Meal Prep</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lime-400">restaurant</span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-zinc-400 mb-6">Prepare high-protein containers for the next 3 days.</p>
          <div className="flex items-center gap-2">
            <div className="w-full bg-zinc-800 h-2 rounded-full">
              <div className="h-full bg-lime-400 w-1/3 rounded-full"></div>
            </div>
            <span className="text-label-sm font-label-sm text-zinc-500 whitespace-nowrap">2/6 items</span>
          </div>
        </div>

        {/* List Card */}
        <div className="md:col-span-2 bg-zinc-900/50 rounded-[24px] border border-white/5 overflow-hidden">
          <div className="p-container-padding border-b border-white/5 flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-primary uppercase">Active Checklist</h3>
            <span className="material-symbols-outlined text-zinc-500 cursor-pointer hover:text-white">more_horiz</span>
          </div>
          <div className="divide-y divide-white/5">
            <div className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="w-6 h-6 rounded border-2 border-lime-400/50 flex items-center justify-center group-hover:bg-lime-400/10 transition-all">
                <span className="material-symbols-outlined text-lime-400 text-sm hidden group-hover:block">check</span>
              </div>
              <span className="font-body-md text-body-md flex-1">Morning Mobility Flow</span>
              <span className="font-label-sm text-label-sm text-zinc-500">08:00 AM</span>
            </div>
            <div className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group bg-lime-400/5">
              <div className="w-6 h-6 rounded bg-lime-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-black text-sm font-bold">check</span>
              </div>
              <span className="font-body-md text-body-md flex-1 line-through text-zinc-500">Hydration Goal: 4L</span>
              <span className="font-label-sm text-label-sm text-lime-400/50">DONE</span>
            </div>
            <div className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="w-6 h-6 rounded border-2 border-zinc-700 flex items-center justify-center"></div>
              <span className="font-body-md text-body-md flex-1">Supplement Stack Check</span>
              <span className="font-label-sm text-label-sm text-zinc-500">09:30 PM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter mt-8">
        <div className="bg-zinc-900/50 p-stack-md rounded-[20px] border border-white/5 text-center">
          <p className="font-label-sm text-label-sm text-zinc-500 uppercase">Streak</p>
          <p className="font-display-xl text-[32px] text-lime-400">{stats.streak}</p>
        </div>
        <div className="bg-zinc-900/50 p-stack-md rounded-[20px] border border-white/5 text-center">
          <p className="font-label-sm text-label-sm text-zinc-500 uppercase">Calories</p>
          <p className="font-display-xl text-[32px] text-white">
            {stats.calories >= 1000 ? (stats.calories / 1000).toFixed(1) + 'k' : stats.calories || '2.4k'}
          </p>
        </div>
        <div className="bg-zinc-900/50 p-stack-md rounded-[20px] border border-white/5 text-center">
          <p className="font-label-sm text-label-sm text-zinc-500 uppercase">Volume</p>
          <p className="font-display-xl text-[32px] text-white">{stats.volume}</p>
        </div>
        <div className="bg-zinc-900/50 p-stack-md rounded-[20px] border border-white/5 text-center">
          <p className="font-label-sm text-label-sm text-zinc-500 uppercase">Sleep</p>
          <p className="font-display-xl text-[32px] text-white">{stats.sleep}</p>
        </div>
      </section>
    </main>
  );
}
