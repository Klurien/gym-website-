import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Live() {
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLiveVideos();
  }, []);

  const fetchLiveVideos = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const rawPosts = await res.json();
        // Filter out posts that are videos or labeled 'live'
        let vidPosts = rawPosts.filter(p => p.type === 'live' || p.media_url?.includes('.mp4'));
        
        if (vidPosts.length === 0) {
          // Placeholder defaults if no DB content is matched
          vidPosts = [
            {
              id: 'pl1',
              trainer_name: 'Alex Rivers',
              title: 'Peak Velocity Squats',
              description: 'Pushing past the threshold today. Focus on explosive concentric movement and controlled descent. #KineticIntensity #EliteTier',
              media_url: '/videos/aerobics_new.mp4',
              likes_count: '42.8K',
              comments_count: '1.2K'
            },
            {
              id: 'pl2',
              trainer_name: 'Sarah Kovac',
              title: 'Upper Body Burn',
              description: 'Strict form. High reps. Let’s build that dense muscle today.',
              media_url: '/videos/strength_new.mp4',
              likes_count: '12K',
              comments_count: '850'
            }
          ];
        }
        setVideos(vidPosts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 h-16 bg-zinc-900/40 backdrop-blur-md rounded-2xl mt-4 mx-5 border border-white/10 shadow-[0px_10px_30px_rgba(0,0,0,0.5)] cursor-pointer">
        <button onClick={() => navigate('/feed')} className="text-white hover:scale-105 transition-transform duration-200 active:scale-95 transition-all w-10 flex text-left">
          <span className="material-symbols-outlined text-shadow">arrow_back</span>
        </button>
        <div className="flex flex-col items-center flex-1">
          <h1 className="text-xl font-black text-white drop-shadow-[0_0_15px_rgba(204,255,0,0.8)] font-lexend tracking-tighter uppercase leading-none">LIVE</h1>
        </div>
        <div className="w-10 flex justify-end">
          <button className="text-white hover:scale-105 transition-transform duration-200 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-shadow">notifications</span>
          </button>
        </div>
      </header>

      {/* Main Content: Immersive Vertical Video Feed */}
      <main className="h-screen w-full relative bg-black snap-y snap-mandatory overflow-y-scroll overflow-x-hidden disable-scrollbars">
        
        {videos.map(video => (
          <div key={video.id} className="w-full h-screen w-full relative snap-start snap-always shrink-0 flex flex-col justify-end">
            
            {/* Video Player background */}
            <div className="absolute inset-0 z-0 bg-black">
              <video 
                className="w-full h-full object-cover"
                src={video.media_url}
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 opacity-80 pointer-events-none"></div>
            </div>

            {/* Overlays */}
            <div className="relative h-full w-full flex flex-col justify-end p-6 pb-32">
              {/* Side Actions Bar */}
              <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10 drop-shadow-2xl">
                <div className="flex flex-col items-center group">
                  <button className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </button>
                  <span className="text-[10px] font-bold mt-1 text-white text-shadow">{video.likes_count}</span>
                </div>
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all">
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                  <span className="text-[10px] font-bold mt-1 text-white text-shadow">{video.comments_count}</span>
                </div>
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                  <span className="text-[10px] font-bold mt-1 text-white text-shadow">Share</span>
                </div>
                <div className="mt-2">
                  <div className="w-10 h-10 bg-lime-400 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(204,255,0,0.8)] cursor-pointer hover:scale-110 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-black font-bold">add</span>
                  </div>
                </div>
              </div>

              {/* Profile Info & Workout Stats */}
              <div className="max-w-[75%] space-y-3 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-lime-400 text-black px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(204,255,0,0.3)] animate-pulse">LIVE</div>
                  <span className="text-white font-black text-lg drop-shadow-md">{video.trainer_name}</span>
                </div>
                <h2 className="text-white font-bold text-xl drop-shadow-md">{video.title}</h2>
                <p className="text-zinc-200 text-sm line-clamp-2 drop-shadow-md shadow-black">
                  {video.description}
                </p>

                {/* Tags/Stats */}
                <div className="flex gap-2 pt-2 pb-2 overflow-hidden flex-wrap">
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-white">45:00</span>
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-lime-400">X-9 INTENSITY</span>
                </div>
              </div>

              {/* Progress Scrub */}
              <div className="absolute bottom-24 left-6 right-6 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#33FF00] to-[#CCFF00] w-[65%] shadow-[0_0_10px_rgba(204,255,0,0.8)]"></div>
              </div>
            </div>
          </div>
        ))}
      </main>

      <style>{`
        .disable-scrollbars::-webkit-scrollbar { display: none; }
        .disable-scrollbars { -ms-overflow-style: none; scrollbar-width: none; }
        .text-shadow { text-shadow: 0px 2px 4px rgba(0,0,0,0.8); }
      `}</style>
    </>
  );
}
