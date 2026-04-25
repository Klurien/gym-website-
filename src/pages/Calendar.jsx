import React from 'react';

export default function Calendar() {
  return (
    <main className="pt-28 pb-32 px-edge-margin space-y-stack-lg max-w-2xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col gap-unit">
        <p className="text-label-sm font-label-sm text-lime-400 uppercase tracking-[0.2em]">Training Schedule</p>
        <h2 className="text-headline-lg font-headline-lg text-primary">October 2023</h2>
      </div>

      {/* Monthly Calendar Card */}
      <section className="bg-[#1A1A1A] rounded-[24px] p-container-padding shadow-2xl border border-white/5 relative overflow-hidden">
        {/* Subtle Energy Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-400/10 blur-[80px] rounded-full"></div>
        <div className="grid grid-cols-7 gap-y-stack-md text-center">
          {/* Days of Week */}
          <span className="text-label-sm font-label-sm text-zinc-500">M</span>
          <span className="text-label-sm font-label-sm text-zinc-500">T</span>
          <span className="text-label-sm font-label-sm text-zinc-500">W</span>
          <span className="text-label-sm font-label-sm text-zinc-500">T</span>
          <span className="text-label-sm font-label-sm text-zinc-500">F</span>
          <span className="text-label-sm font-label-sm text-zinc-500">S</span>
          <span className="text-label-sm font-label-sm text-zinc-500">S</span>
          
          {/* Calendar Days (Abbreviated) */}
          <span className="text-body-md font-body-md text-zinc-700">25</span>
          <span className="text-body-md font-body-md text-zinc-700">26</span>
          <span className="text-body-md font-body-md text-zinc-700">27</span>
          <span className="text-body-md font-body-md text-zinc-700">28</span>
          <span className="text-body-md font-body-md text-zinc-700">29</span>
          <span className="text-body-md font-body-md text-zinc-700">30</span>
          
          <span className="text-body-md font-body-md text-primary">1</span>
          <span className="text-body-md font-body-md text-primary">2</span>
          <span className="text-body-md font-body-md text-primary">3</span>
          <span className="text-body-md font-body-md text-primary">4</span>
          <span className="text-body-md font-body-md text-primary">5</span>
          <span className="text-body-md font-body-md text-primary relative">
            6
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime-400 rounded-full"></span>
          </span>
          <span className="text-body-md font-body-md text-primary">7</span>
          <span className="text-body-md font-body-md text-primary">8</span>
          <span className="text-body-md font-body-md text-primary">9</span>
          <span className="text-body-md font-body-md text-primary">10</span>
          <span className="text-body-md font-body-md text-primary relative">
            11
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime-400 rounded-full"></span>
          </span>
          
          <div className="flex items-center justify-center">
            <span className="w-8 h-8 flex items-center justify-center bg-lime-400 text-black font-bold rounded-full shadow-[0_0_15px_rgba(204,255,0,0.4)]">12</span>
          </div>
          
          <span className="text-body-md font-body-md text-primary">13</span>
          <span className="text-body-md font-body-md text-primary">14</span>
          <span className="text-body-md font-body-md text-primary">15</span>
        </div>

        <div className="mt-stack-lg pt-stack-md border-t border-white/10 flex justify-between items-center">
          <div className="flex -space-x-2">
            <img 
              alt="user" 
              className="w-6 h-6 rounded-full border-2 border-[#1A1A1A]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjIHCyy2FgAEVqm2mrtSSMEQR487HCEeRTp1V6uBnuaiDAKdu0gdxPWK5T6NwS0gECEYukUQPesmlEkItw8pLVEdeM-G8OrO6uF13LVKpJLaGslhhYWJZISetrJakjiPOux5MEP6AgxMtMdDtEH4sdZIXZ7UxXPvmu7BnaLRVV6Ya7bC4fTEW4vCUQYVB5mHnsQMkgtIVH4A3n_AHM2NxY_A1hLQ9E56HwdtO1s5SQalQX0mANePQ49OR2GiTE-tZoaCfQbGunHbeo"
            />
            <img 
              alt="user" 
              className="w-6 h-6 rounded-full border-2 border-[#1A1A1A]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAO8KcMQAI4FitEdmhncRcu5vN4GUj5sO5SV11f1dXBZViVdMeJ95EdlYz1qI4N4jFcqWaG0lciqfFCwcLOhQH3DuQ_hzCdCVLBX1dkctFr4iVb5QM9OpKMiXq8SXfwaQ4b0P2U8_vYdl6SBbMdLOdSbYqJBPJFHyBkxIVH4lLrb8tYQrtFvnd_CIWu4jiHqCedft9g62RsqurJrhEYf0F4Hk97R1lDmIk-aBZDQJYgUk8gaSZQWcj25mIHNlg80w81vx71XMUMt9M"
            />
            <div className="w-6 h-6 rounded-full border-2 border-[#1A1A1A] bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-lime-400">+4</div>
          </div>
          <span className="text-label-sm font-label-sm text-zinc-400">6 sessions scheduled today</span>
        </div>
      </section>

      {/* Today's Session Detail */}
      <section className="space-y-stack-md">
        <h3 className="text-headline-md font-headline-md text-primary">Next Session</h3>
        <div className="bg-[#1A1A1A] rounded-[24px] overflow-hidden shadow-2xl border border-white/5 group hover:border-lime-400/30 transition-colors duration-300">
          <div className="relative h-32 w-full overflow-hidden cursor-pointer">
            <img 
              alt="Gym environment" 
              className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD95XSlFYb76FfDl3GnhBu3Sxf1MEEDIBLAO7qnBPt_mn_d1orVdxZPtkLfnlN1m_xZLIH3DBs6lSoUJmjTMz2ukZti8uglOQOprN52kpl27KfizZZt4CuAVaV6Rf8ttjqVvH3mNYSct4jCWJCam6ogFKU0upxP-BLMxROO2euxdmHiJKQqRm9NtwQOGo-MqHOOOCCSX0rNl6AZj_oE24cMarObXftrFFppVo_NAReCGgyGOpVkGlJFlLGH_B2TEkUJsl-dC92J-4LY"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent"></div>
            <div className="absolute bottom-4 left-6">
              <span className="px-3 py-1 bg-lime-400 text-black text-label-sm font-bold rounded-full tracking-widest leading-none">ACTIVE</span>
            </div>
          </div>
          <div className="p-container-padding space-y-stack-md">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-headline-md font-headline-md text-primary">Hypertrophy Upper Body</h4>
                <p className="text-body-md font-body-md text-zinc-400 mt-1">Client: Alex Rivers • Elite Tier</p>
              </div>
              <div className="text-right">
                <p className="text-display-xl font-display-xl text-lime-400 leading-none">09:30</p>
                <p className="text-label-sm font-label-sm text-zinc-500 tracking-widest uppercase mt-1">AM</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-gutter">
              <div className="bg-zinc-900/50 p-stack-md rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span className="text-label-sm font-label-sm uppercase">Intensity</span>
                </div>
                <p className="text-body-lg font-body-lg text-primary">High (85% RPE)</p>
              </div>
              <div className="bg-zinc-900/50 p-stack-md rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  <span className="text-label-sm font-label-sm uppercase">Duration</span>
                </div>
                <p className="text-body-lg font-body-lg text-primary">75 Minutes</p>
              </div>
            </div>
            
            <button className="w-full bg-lime-400 text-black font-lexend font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-lime-300 transition-colors active:scale-95 duration-150 uppercase tracking-widest">
              <span className="material-symbols-outlined font-variation-settings-'FILL' 1" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              Start Session
            </button>
          </div>
        </div>
      </section>

      {/* Small Quick Actions Bento */}
      <div className="grid grid-cols-2 gap-gutter">
        <div className="bg-[#1A1A1A] p-container-padding rounded-[24px] border border-white/5 flex flex-col gap-stack-sm hover:bg-zinc-900 transition-colors cursor-pointer active:scale-95 duration-200">
          <span className="material-symbols-outlined text-lime-400">add_task</span>
          <p className="text-label-bold font-label-bold text-primary">New Client</p>
        </div>
        <div className="bg-[#1A1A1A] p-container-padding rounded-[24px] border border-white/5 flex flex-col gap-stack-sm hover:bg-zinc-900 transition-colors cursor-pointer active:scale-95 duration-200">
          <span className="material-symbols-outlined text-lime-400">analytics</span>
          <p className="text-label-bold font-label-bold text-primary">Performance</p>
        </div>
      </div>
    </main>
  );
}
