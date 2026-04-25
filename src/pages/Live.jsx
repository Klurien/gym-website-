import React from 'react';

export default function Live() {
  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 h-16 bg-zinc-900/80 backdrop-blur-xl rounded-2xl mt-4 mx-5 border border-white/10 shadow-[0px_10px_30px_rgba(204,255,0,0.15)]">
        <button className="text-lime-400 hover:scale-105 transition-transform duration-200 active:scale-95 transition-all">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black text-lime-400 font-lexend tracking-tighter uppercase leading-none">KINETIC</h1>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">Alex Rivers</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-zinc-500 hover:scale-105 transition-transform duration-200 active:scale-95 transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full border border-lime-400 p-0.5">
            <img 
              alt="Alex Rivers Profile" 
              className="w-full h-full rounded-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI78jpuz5J2KZljZzWgC2Who6C8LEy1GCLnpEszWJJ66p91fSTj4yxoyRXI1ZMvsgC3igyRbIXHfbBCm-7X1evQ8AA2aLdNzWEwikxonE241cGO5efBKxIF34XmHaaltyj_YREWK5F--Scp1NFdwIfOsP3dHAwfmiP6VcZ6JNh8On3T7Pu2AcUtHQBnLMBt4ScxZ1GfRUkbGy286Ahn1kFqNnfnTGVvBUKe_AtwgoOZ5DmCVeIPp_2kCe8z0wO8igOAJy0LSqetFlP"
            />
          </div>
        </div>
      </header>

      {/* Main Content: Immersive Vertical Video Feed */}
      <main className="h-screen w-full relative">
        {/* Video Layer (Simulated Background) */}
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover grayscale brightness-50 contrast-125" 
            alt="Intense fitness video" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuACtuOiObmEg0Qdr320GDfHq-4991-IDY0LFb6vtQVVxDTL0mpc5ZrbVF2azSYzfpF2eTwqCQFuMK2DLrKA_ij3-5eRee5_LdEp5NYTXxJz_MYeo7hiXEe8zxXqKRCFoqDHIvfmHXMl4YmT4JRO8ODSkXOyQVNhjfOKd9Ouw6Nwa8yisdaWZSoy_S1Twb_AyZagJcC_0DsnNuU5bSWNrF25aipJwd7Rrf8l6uwxhl6T2Plvgj3FGEJhBImCKmIurJvXPStF1_zceq8Z"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
        </div>

        {/* Overlays */}
        <div className="relative h-full w-full flex flex-col justify-end p-6 pb-32">
          {/* Side Actions Bar */}
          <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
            <div className="flex flex-col items-center group">
              <button className="w-14 h-14 bg-zinc-900/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </button>
              <span className="text-label-sm font-label-sm mt-1 text-white">42.8K</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="w-14 h-14 bg-zinc-900/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">
                <span className="material-symbols-outlined">chat</span>
              </button>
              <span className="text-label-sm font-label-sm mt-1 text-white">1.2K</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="w-14 h-14 bg-zinc-900/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">
                <span className="material-symbols-outlined">share</span>
              </button>
              <span className="text-label-sm font-label-sm mt-1 text-white">Share</span>
            </div>
            <div className="mt-4">
              <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.4)] animate-pulse cursor-pointer hover:scale-110 active:scale-90 transition-all">
                <span className="material-symbols-outlined text-black font-bold">add</span>
              </div>
            </div>
          </div>

          {/* Profile Info & Workout Stats */}
          <div className="max-w-[70%] space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-lime-400 text-black px-3 py-1 rounded-full text-label-bold font-label-bold uppercase tracking-tighter shadow-[0_0_15px_rgba(204,255,0,0.3)]">Live Session</div>
              <span className="text-white font-bold text-headline-md font-headline-md">Peak Velocity Squats</span>
            </div>
            <p className="text-zinc-300 text-body-md font-body-md line-clamp-2">
              Pushing past the threshold today. Focus on explosive concentric movement and controlled descent. #KineticIntensity #EliteTier
            </p>

            {/* Stats Grid */}
            <div className="flex gap-4 pt-2">
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                <span className="material-symbols-outlined text-lime-400">timer</span>
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest leading-none">Duration</div>
                  <div className="text-white text-label-bold font-label-bold leading-none mt-1">45:00</div>
                </div>
              </div>
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 hidden sm:flex">
                <span className="material-symbols-outlined text-lime-400">bolt</span>
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest leading-none">Intensity</div>
                  <div className="text-white text-label-bold font-label-bold leading-none mt-1">X-9</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Scrub */}
          <div className="absolute bottom-24 left-6 right-6 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#33FF00] to-[#CCFF00] w-[65%] shadow-[0_0_10px_rgba(204,255,0,0.8)]"></div>
          </div>
        </div>
      </main>

      {/* Navigation Layer */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 px-6 bg-zinc-900/90 backdrop-blur-2xl rounded-full mb-8 mx-10 border border-white/5 shadow-[0px_20px_50px_rgba(0,0,0,0.5)]">
        <button onClick={() => window.location.href='/'} className="p-3 bg-lime-400 text-black rounded-full shadow-[0_0_20px_rgba(204,255,0,0.6)] active:scale-90 duration-150 flex items-center justify-center transition-all">
          <span className="material-symbols-outlined font-bold">home</span>
        </button>
        <button onClick={() => window.location.href='/messages'} className="text-zinc-500 p-3 hover:text-lime-400 transition-colors active:scale-90 duration-150 flex items-center justify-center">
          <span className="material-symbols-outlined">chat</span>
        </button>
        <button onClick={() => window.location.href='/calendar'} className="text-zinc-500 p-3 hover:text-lime-400 transition-colors active:scale-90 duration-150 flex items-center justify-center">
          <span className="material-symbols-outlined">event_note</span>
        </button>
        <button onClick={() => window.location.href='/tasks'} className="text-zinc-500 p-3 hover:text-lime-400 transition-colors active:scale-90 duration-150 flex items-center justify-center">
          <span className="material-symbols-outlined">crisis_alert</span>
        </button>
      </nav>

      {/* Side Navigation Drawer (Hidden by default, used for structural alignment) */}
      <aside className="fixed left-0 top-0 h-full w-80 bg-zinc-950 border-r border-white/10 transform -translate-x-full z-[60] transition-transform duration-300">
        <div className="p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-lime-400">
              <img 
                alt="Alex Rivers" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA42jPnsjBZythYgWv8lF4Ghy17yayyqULfIrR_UDy-PLP0z0bdhSSyA5-v_-pl5b1sigLibRjBFtaMQ3e86RBUadoVACdlSokrHy7pCQCDFXaPXfySzhj-bBjgfvPNfM6l2MDOk1OjfvgBFUUNBg1fS4KeCaoVIFLoexbI8zS_2I4EGOw1bqXu2U4i-C3rlec9eGV5m6yEF4-lCXsQwh6vtge14JkN8cazFWGhm5Cw-3BCojgyRBwgTKQpcXJ1WAh37MIjRYSvd-Nf"
              />
            </div>
            <div>
              <div className="text-lime-400 font-black font-lexend">Alex Rivers</div>
              <div className="text-zinc-500 text-xs uppercase tracking-widest">Elite Tier</div>
            </div>
          </div>
          
          <nav className="space-y-2">
            <a className="flex items-center gap-4 p-4 rounded-xl bg-lime-400/10 text-lime-400 border-l-4 border-lime-400 font-lexend font-medium cursor-pointer">
              <span className="material-symbols-outlined">grid_view</span>
              <span>Dashboard</span>
            </a>
            <a className="flex items-center gap-4 p-4 rounded-xl text-zinc-400 hover:bg-zinc-900 transition-all font-lexend font-medium cursor-pointer">
              <span className="material-symbols-outlined">fitness_center</span>
              <span>Workouts</span>
            </a>
          </nav>
        </div>
      </aside>
    </>
  );
}
