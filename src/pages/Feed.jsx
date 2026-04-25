import React, { useState, useEffect } from 'react';

export default function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // In a real app we'd fetch from /api/posts here
    // For now we render the raw static mockup structure provided
  }, []);

  return (
    <main className="pt-28 pb-32 px-edge-margin space-y-gutter max-w-2xl mx-auto">
      {/* Stories/Quick Access Bento (Custom Extension) */}
      <div className="grid grid-cols-4 gap-stack-md h-24 mb-stack-lg">
        <div className="col-span-1 bg-zinc-900/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 hover:border-lime-400/50 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-400">add</span>
          </div>
          <span className="font-label-sm text-label-sm text-zinc-500">Post</span>
        </div>
        <div className="col-span-3 bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden relative group cursor-pointer">
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" 
            alt="Live Workout" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSEjHP7QrRZn36afYXkYWwhYMzgsOeYHS1skaXUClEJrCEBYSXYPrCqtDIpKrZ7zQImqCZdnx2if-obOliXGrFkS-IhxiezKagtuXvacy978-LeN5yPBQe7EEbbsgd6H260sALF_bxu2HZMawJHmBZeHBUF-C3bTwHqd191HTZ9aus5dwyDHchV28CuBKMfY59RJ_oezS06FSoRbqb45me7-nWyy7nmFBJAxU196YIy1bvBirwGVLMRrEa2SZac5fXpi-DDtqdADiY"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-3 left-4">
            <p className="font-label-bold text-label-bold text-lime-400">Live Workout</p>
            <p className="font-label-sm text-label-sm text-white">Join Alex in 5 mins</p>
          </div>
        </div>
      </div>

      {/* Feed Post 1 */}
      <article className="bg-zinc-900/60 rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative group">
        <div className="p-container-padding flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              className="w-10 h-10 rounded-full border border-lime-400" 
              alt="Alex Rivers" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa2yTUoLjx-eIJTSin1a1GOyN1OgPlDwSUa1MS7_xvki2yYf7kTr_T3uuB_MhLXKTracrONJJ-CDoiwBR92qRE8oCVLxwmkwhweQpHRJ4Ib8wuvmJhW9TBic82Sb3aBE1Npa3qXfYe2_OmdJpanCFDm9Si9Dleu7XPqh_48bj8LGIA8UvdHibfPc7eJ8V1Vk-dfESooQNu3VYN7us6RT_aWTO1wCi3bYt8JwbhJF2Cv6iVyf-7Ur02zSWu2lyfTxpUrPhH5GH3zHD0"
            />
            <div>
              <h3 className="font-label-bold text-label-bold text-on-surface">Alex Rivers</h3>
              <p className="font-label-sm text-label-sm text-zinc-500">Elite Tier • 2h ago</p>
            </div>
          </div>
          <button className="text-zinc-500">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
        <div className="mx-4 relative aspect-[4/5] rounded-[20px] overflow-hidden">
          <img 
            className="w-full h-full object-cover" 
            alt="Workout" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLROueBxPmAcdXUhD9cZrpBeyS08cmliZxuoQQ5QiqbWwaENcJxmCLabrPH3hhhFf3xwdsaxLCmShUtA_BCEOWsTt_Ra59rxT_m-HyeOJ6PDwGx9HRDjUl6sepC5lCe6g3quem2QO-Bt1t7wzMZCyKjiSyfO6XOOXHWlrtPlCrXBa5A9UtxvrdBZrRCSY-JwNcpz4P6lk4FvXXpQ2HD7qVquoIdMfDl1AhUy4jAqmNR4LtyTmPizLOXs-eODUh3vHXSr3v4aCTHPaL"
          />
          <div className="absolute top-4 right-4 bg-lime-400 text-black px-3 py-1 rounded-full font-label-bold text-[10px] uppercase tracking-widest kinetic-glow">
            Power Move
          </div>
        </div>
        <div className="p-container-padding space-y-3">
          <p className="font-body-md text-body-md text-zinc-300 leading-relaxed">
            Crushing the morning leg session. Remember: velocity comes from the core. Stay focused on the kinetic chain. ⚡️ #LegDay #KineticPower
          </p>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-lime-400 group/btn">
                <span className="material-symbols-outlined group-active/btn:scale-125 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <span className="font-label-bold text-label-bold">2.4k</span>
              </button>
              <button className="flex items-center gap-2 text-zinc-400">
                <span className="material-symbols-outlined">chat</span>
                <span className="font-label-bold text-label-bold">128</span>
              </button>
              <button className="flex items-center gap-2 text-zinc-400">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
            <button className="text-zinc-500">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </div>
      </article>

      {/* Feed Post 2 */}
      <article className="bg-zinc-900/60 rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative group mt-8">
        <div className="p-container-padding flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              className="w-10 h-10 rounded-full border border-zinc-700" 
              alt="Sarah Kovac" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3xo0lYbpDsRF7OZaGQrBuHc1_hKf6NPKMTb1EkeR0OFb0rnw1QEVQbpwCHfyeKIMXSfeQsPdt2H3Jpc6p77awatXreqlLzl14zZiXnROuQY-Ht0pjpj8rK_vYiJS1yU9K17Os9kIw8NcOE-aqeIh6iwWPe0Pjqig8FQBegnUGTohfjImbikNX3shj28ink8jbuziTj3GkCFdiDoeVxTRBwA7JIBWpQxm_cCFuKwuUP2CODlAKqwSndjvNMOHrrcPtFoKdr3u3TIKm"
            />
            <div>
              <h3 className="font-label-bold text-label-bold text-on-surface">Sarah Kovac</h3>
              <p className="font-label-sm text-label-sm text-zinc-500">Pro Coach • 5h ago</p>
            </div>
          </div>
          <button className="text-zinc-500">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
        <div className="mx-4 relative aspect-video rounded-[20px] overflow-hidden cursor-pointer">
          <img 
            className="w-full h-full object-cover brightness-75" 
            alt="Mobility Flow" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL1xpKjmfS2V2zax9_z8WRftiT_sDCT1MgUq-PJTLrjyUpRzhzDWrogIqVnDS0IlaqA2ksXBaIKsGiZGImrMKVGGXzvVSCtCyLPCgU2-0CvyyfkbiDa-N0txnWk7cpD2XpGUFcfpp7llcuGCOorfZtG6l7yfoBt-XRGermx9cgRNFaozSvktc8Ot1-tSsVpEo2Xdl3lNjMtIfv9kiXrzoWzkEQzLxJThZKPt6St2HscazgujiFsTaCa3gzot6LcWURVU6MfK8OGn8r"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-lime-400/20 backdrop-blur-md rounded-full flex items-center justify-center border border-lime-400/50 hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-lime-400 text-4xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full">
            <div className="w-1/3 h-full bg-lime-400 rounded-full kinetic-glow"></div>
          </div>
        </div>
        <div className="p-container-padding space-y-3">
          <p className="font-body-md text-body-md text-zinc-300 leading-relaxed">
            New mobility flow released on the dashboard. Perfect for recovery days. Check the Schedule tab for the live follow-along.
          </p>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-zinc-400 group/btn hover:text-lime-400 transition-colors">
                <span className="material-symbols-outlined group-active/btn:scale-125 transition-transform">favorite</span>
                <span className="font-label-bold text-label-bold">856</span>
              </button>
              <button className="flex items-center gap-2 text-zinc-400 hover:text-lime-400 transition-colors">
                <span className="material-symbols-outlined">chat</span>
                <span className="font-label-bold text-label-bold">42</span>
              </button>
              <button className="flex items-center gap-2 text-zinc-400">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
            <button className="text-zinc-500">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </div>
      </article>

      <button className="fixed bottom-32 right-8 w-14 h-14 bg-lime-400 text-black rounded-2xl shadow-[0_0_30px_rgba(204,255,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

    </main>
  );
}
