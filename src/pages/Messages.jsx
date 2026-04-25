import React from 'react';

export default function Messages() {
  return (
    <main className="pt-32 pb-32 px-edge-margin min-h-screen max-w-2xl mx-auto">
      {/* Hero Section */}
      <section className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-white mb-1">MESSAGES</h2>
        <p className="font-label-sm text-label-sm text-zinc-500 tracking-widest uppercase">Direct line to performance</p>
      </section>

      {/* Search/Filter Bar */}
      <div className="mb-stack-lg relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-zinc-500 text-sm">search</span>
        </div>
        <input 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20 transition-all font-body-md placeholder:text-zinc-600" 
          placeholder="Search trainers or keywords..." 
          type="text"
        />
      </div>

      {/* Conversations List */}
      <div className="grid gap-gutter">
        {/* Message Card 1: Active/New */}
        <div className="group relative bg-zinc-900/50 backdrop-blur-md rounded-2xl p-container-padding border border-white/5 shadow-xl hover:border-lime-400/30 transition-all duration-300 active:scale-[0.98] cursor-pointer">
          <div className="flex gap-4">
            <div className="relative flex-shrink-0">
              <img 
                alt="Trainer" 
                className="w-14 h-14 rounded-2xl object-cover border border-white/10" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDIs7PF3VD8H7yVtsoGAK1m5rYn2-x0whFq3EuUer_doFz4l3G1WJ47IOshs1U2lThdFfJhxkiGCKdf83Wpqt-0RY7PEPQbqVftN5Hucy6agR6R9FbRy45XLG0m5Sp6e13rRx3loEgKOy2hV9epgfnivUryxmnfXU5qM0NAhPzc8Xu0W3Dn1GBhJ7SRkztSIdtDW4xmh09vjWA6rrYjE4log2PE8xJ03Ld33EM8HNAe-rMMHNaRUliTk7kAXcNtpKAnmKdeGXG-aut"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-lime-400 rounded-full border-4 border-zinc-900 shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-headline-md text-body-md font-bold text-white group-hover:text-lime-400 transition-colors">Marcus Vane</h3>
                <span className="font-label-sm text-[10px] text-lime-400 uppercase tracking-tighter">Just Now</span>
              </div>
              <p className="font-body-md text-sm text-zinc-300 line-clamp-1">Your macro adjustments are live in the dashboard. Let's crush those sets today.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="px-3 py-1 bg-lime-400/10 border border-lime-400/20 rounded-full text-[10px] font-bold text-lime-400 uppercase tracking-widest">Training Plan</span>
            <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nutrition</span>
          </div>
        </div>

        {/* Message Card 2 */}
        <div className="group relative bg-zinc-900/30 backdrop-blur-md rounded-2xl p-container-padding border border-white/5 shadow-xl hover:border-lime-400/30 transition-all duration-300 active:scale-[0.98] cursor-pointer">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <img 
                alt="Trainer" 
                className="w-14 h-14 rounded-2xl object-cover border border-white/10 grayscale-[30%]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2MgQnZJ4APLio92ylDFbhE8_Vx9p5TTAY0XXRzTf_piYQQm0yqjZiQZW8ZR_72G7gQDNf2t70w_f5AuN0DaPq5UnvbCLDSP4q2327mP1sOM07DapFStJloNNYlFXCfTg_jYAQE1_MdqujfufYGKEHImwbn8eE3P6K7e6u3VrHeFfDffnrROa5fXlEoeNbLEyGPFCZaGBb4Y3IJJUGXQRp-KZYK_URQ2qi0AsimiIWoUo1opuyRbuveg9FLH39FJ1KWIrwNjjPaESE"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-headline-md text-body-md font-bold text-white group-hover:text-lime-400 transition-colors">Sarah Jenkins</h3>
                <span className="font-label-sm text-[10px] text-zinc-500 uppercase tracking-tighter">14:20 PM</span>
              </div>
              <p className="font-body-md text-sm text-zinc-500 line-clamp-1">The recovery session was great! Don't forget the foam rolling tonight.</p>
            </div>
          </div>
        </div>

        {/* Message Card 3 */}
        <div className="group relative bg-zinc-900/30 backdrop-blur-md rounded-2xl p-container-padding border border-white/5 shadow-xl hover:border-lime-400/30 transition-all duration-300 active:scale-[0.98] cursor-pointer">
          <div className="flex gap-4">
            <div className="flex-shrink-0 relative">
              <img 
                alt="Trainer" 
                className="w-14 h-14 rounded-2xl object-cover border border-white/10 grayscale-[30%]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPuVfY_aJWupJQVFWWjNG-AegXHin7DMHwdyPRwx_3U8YHUKf_sSINcG4KkGZM5if63L8cPps4DH_VJzaWwv5e9Hn0QCDyz-3uI3ycChTSpUYSC0tPLWx6_ciWyv91bc3yLCHkJeIpWmu_1nddoofmUhK7J2lkVfibaDce0BJY34lqy6hcX295AClVHWbtBzyK1IUrAJjAJjSQWeUkxEq1xUQ6NQSW5VvSUUMlXCi7KUsbLmPG9gi5XsjIchGxgej3u7sVpRGhI0_gxiT"
              />
              <div className="absolute -bottom-1 -right-1 bg-zinc-950 text-lime-400 px-1 rounded border border-white/10 text-[8px] font-black italic tracking-tighter">ELITE</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-headline-md text-body-md font-bold text-white group-hover:text-lime-400 transition-colors">Damon Thorne</h3>
                <span className="font-label-sm text-[10px] text-zinc-500 uppercase tracking-tighter">Yesterday</span>
              </div>
              <p className="font-body-md text-sm text-zinc-500 line-clamp-1">Heavy leg day scheduled for Monday. Be ready at 0600 sharp.</p>
            </div>
          </div>
        </div>

        {/* Message Card 4 */}
        <div className="group relative bg-zinc-900/30 backdrop-blur-md rounded-2xl p-container-padding border border-white/5 shadow-xl hover:border-lime-400/30 transition-all duration-300 active:scale-[0.98] cursor-pointer">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <img 
                alt="Trainer" 
                className="w-14 h-14 rounded-2xl object-cover border border-white/10 grayscale-[30%]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmnXfbhGoi4c4Syt2rHKz2ldo-QUlN63ySAmXzGBQr1vemiV--grYiv7Wt3D7uIkjkbLB0htH770myiEC-riIrvhIa1qLnqj-FLFLz0GLkFpxU_Mm4KqVeIMzBHPps7o9FAoyVviDZD2oasMnOLzC9JO1ZSSX0dcBsZSMxtdkjmBXKbWIXTKMOeh9SDNzWNACgGBublvWZ_P_Ys7jbaeCQbcXfKoUPU4AxOaKLydzBNaHeU7V2-F3fOfVzf9isy4mxfkZHpYCw5F1x"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-headline-md text-body-md font-bold text-white group-hover:text-lime-400 transition-colors">Coach Leo</h3>
                <span className="font-label-sm text-[10px] text-zinc-500 uppercase tracking-tighter">OCT 12</span>
              </div>
              <p className="font-body-md text-sm text-zinc-500 line-clamp-1">Awesome form on that deadlift clip you sent. Keep that spine neutral!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action / New Message */}
      <div className="mt-stack-lg">
        <button className="w-full flex items-center justify-center gap-3 bg-zinc-950 border border-white/10 text-zinc-300 py-6 rounded-2xl active:scale-95 transition-all hover:bg-zinc-900">
          <span className="material-symbols-outlined text-lime-400">add_comment</span>
          <span className="font-label-bold text-label-bold uppercase tracking-widest">Start New Conversation</span>
        </button>
      </div>
    </main>
  );
}
