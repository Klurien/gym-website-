import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
    
    try {
      const res = await fetch('/api/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, currentLiked) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Optimistically update UI
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          is_liked: !currentLiked,
          likes_count: currentLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1
        };
      }
      return p;
    }));

    try {
      await fetch('/api/posts_social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: currentLiked ? 'unlike' : 'like', post_id: postId })
      });
    } catch (e) {
      // Revert on error
      fetchPosts();
    }
  };

  return (
    <main className="pt-28 pb-32 px-edge-margin space-y-gutter max-w-2xl mx-auto">
      {/* Stories/Quick Access Bento */}
      <div className="grid grid-cols-4 gap-stack-md h-24 mb-stack-lg">
        <div className="col-span-1 bg-zinc-900/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 hover:border-lime-400/50 transition-colors cursor-pointer active:scale-95 duration-150">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-400">add</span>
          </div>
          <span className="font-label-sm text-label-sm text-zinc-500">Post</span>
        </div>
        <div onClick={() => navigate('/live')} className="col-span-3 bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden relative group cursor-pointer active:scale-95 transition-all duration-150">
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

      {loading ? (
        <div className="flex justify-center p-10">
          <span className="material-symbols-outlined animate-spin text-lime-400 text-3xl">refresh</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center p-10 text-zinc-500 font-label-bold uppercase">No Posts Yet</div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="bg-zinc-900/60 rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative group mb-8">
            <div className="p-container-padding flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  className={`w-10 h-10 rounded-full border ${post.trainer_name === 'Alex Rivers' ? 'border-lime-400' : 'border-zinc-700'}`}
                  alt={post.trainer_name} 
                  src={post.profile_pic || "https://lh3.googleusercontent.com/aida-public/AB6AXuAa2yTUoLjx-eIJTSin1a1GOyN1OgPlDwSUa1MS7_xvki2yYf7kTr_T3uuB_MhLXKTracrONJJ-CDoiwBR92qRE8oCVLxwmkwhweQpHRJ4Ib8wuvmJhW9TBic82Sb3aBE1Npa3qXfYe2_OmdJpanCFDm9Si9Dleu7XPqh_48bj8LGIA8UvdHibfPc7eJ8V1Vk-dfESooQNu3VYN7us6RT_aWTO1wCi3bYt8JwbhJF2Cv6iVyf-7Ur02zSWu2lyfTxpUrPhH5GH3zHD0"}
                />
                <div>
                  <h3 className="font-label-bold text-label-bold text-on-surface">{post.trainer_name}</h3>
                  <p className="font-label-sm text-label-sm text-zinc-500">
                    Elite Tier • {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button className="text-zinc-500">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            
            <div className={`mx-4 relative ${post.type === 'live' ? 'aspect-video' : 'aspect-[4/5]'} rounded-[20px] overflow-hidden cursor-pointer`}>
              <img 
                className={`w-full h-full object-cover ${post.type === 'live' ? 'brightness-75' : ''}`}
                alt="Post Media" 
                src={post.media_url}
                onError={(e) => { e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBLROueBxPmAcdXUhD9cZrpBeyS08cmliZxuoQQ5QiqbWwaENcJxmCLabrPH3hhhFf3xwdsaxLCmShUtA_BCEOWsTt_Ra59rxT_m-HyeOJ6PDwGx9HRDjUl6sepC5lCe6g3quem2QO-Bt1t7wzMZCyKjiSyfO6XOOXHWlrtPlCrXBa5A9UtxvrdBZrRCSY-JwNcpz4P6lk4FvXXpQ2HD7qVquoIdMfDl1AhUy4jAqmNR4LtyTmPizLOXs-eODUh3vHXSr3v4aCTHPaL" }}
              />
              
              {post.type === 'live' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-lime-400/20 backdrop-blur-md rounded-full flex items-center justify-center border border-lime-400/50 hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lime-400 text-4xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              )}

              {post.type === 'live' && (
                <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full">
                  <div className="w-1/3 h-full bg-lime-400 rounded-full kinetic-glow"></div>
                </div>
              )}

              {post.tags && (
                <div className="absolute top-4 right-4 bg-lime-400 text-black px-3 py-1 rounded-full font-label-bold text-[10px] uppercase tracking-widest kinetic-glow">
                  {post.tags}
                </div>
              )}
            </div>

            <div className="p-container-padding space-y-3">
              <p className="font-body-md text-body-md text-zinc-300 leading-relaxed">
                {post.description}
              </p>
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handleLike(post.id, post.is_liked)}
                    className="flex items-center gap-2 group/btn active:scale-95 transition-all"
                  >
                    <span 
                      className={`material-symbols-outlined group-active/btn:scale-125 transition-transform ${post.is_liked ? 'text-lime-400' : 'text-zinc-400 hover:text-lime-400'}`} 
                      style={post.is_liked ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      favorite
                    </span>
                    <span className={`font-label-bold text-label-bold ${post.is_liked ? 'text-lime-400' : 'text-zinc-400'}`}>
                      {post.likes_count}
                    </span>
                  </button>
                  <button className="flex items-center gap-2 text-zinc-400 hover:text-lime-400 transition-colors active:scale-95">
                    <span className="material-symbols-outlined">chat</span>
                    <span className="font-label-bold text-label-bold">{post.comments_count}</span>
                  </button>
                  <button className="flex items-center gap-2 text-zinc-400 active:scale-95">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
                <button className="text-zinc-500 active:scale-95">
                  <span className="material-symbols-outlined">bookmark</span>
                </button>
              </div>
            </div>
          </article>
        ))
      )}

      <button className="fixed bottom-32 right-8 w-14 h-14 bg-lime-400 text-black rounded-2xl shadow-[0_0_30px_rgba(204,255,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

    </main>
  );
}
