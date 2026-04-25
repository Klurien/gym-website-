import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(null); // stores post_id or null
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Post form state
  const [postForm, setPostForm] = useState({ title: '', description: '', media_url: '', tags: '', type: 'static' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }
    
    try {
      const res = await fetch('/api/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        navigate('/auth');
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
      await fetch('/api/posts_social?action=like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ post_id: postId })
      });
    } catch (e) {
      fetchPosts();
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(postForm)
      });
      if (res.ok) {
        setShowPostModal(false);
        setPostForm({ title: '', description: '', media_url: '', tags: '', type: 'static' });
        fetchPosts();
      } else {
        alert('Failed to create post. Only Pro trainers can post.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openComments = async (postId) => {
    setShowCommentsModal(postId);
    setLoadingComments(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/posts_social?action=comments&post_id=${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setComments(await res.json());
      }
    } finally {
      setLoadingComments(false);
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/posts_social?action=comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ post_id: showCommentsModal, comment: newComment })
      });
      if (res.ok) {
        setNewComment('');
        openComments(showCommentsModal); // refresh comments
        // Optimistically increment comments count on feed
        setPosts(prev => prev.map(p => p.id === showCommentsModal ? { ...p, comments_count: p.comments_count + 1 } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="pt-28 pb-32 px-edge-margin space-y-gutter max-w-2xl mx-auto">
      {/* Personalized Welcome Header */}
      <div className="mb-8 pl-1">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
          Morning, <span className="text-lime-400">{user.username || 'Member'}</span>
        </h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Your Daily Progress</p>
      </div>

      {/* Stories/Quick Access Bento */}
      <div className="grid grid-cols-4 gap-stack-md h-24 mb-stack-lg">
        <div onClick={() => setShowPostModal(true)} className="col-span-1 bg-zinc-900/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 hover:border-lime-400/50 transition-colors cursor-pointer active:scale-95 duration-150">
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
        <div className="text-center p-10 text-zinc-500 font-label-bold uppercase tracking-widest text-[10px]">No Posts Found</div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="bg-zinc-900/60 rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative group mb-8">
             <div className="p-container-padding flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full border overflow-hidden ${post.trainer_name === 'Alex Rivers' ? 'border-lime-400' : 'border-zinc-700'}`}>
                    <img 
                      alt={post.trainer_name} 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.trainer_name}`}
                      className="w-full h-full object-cover"
                    />
                </div>
                <div>
                  <h3 className="font-label-bold text-label-bold text-on-surface">{post.trainer_name}</h3>
                  <p className="font-label-sm text-label-sm text-zinc-500">
                    {post.type.toUpperCase()} • {new Date(post.created_at).toLocaleDateString()}
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
                src={post.media_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBLROueBxPmAcdXUhD9cZrpBeyS08cmliZxuoQQ5QiqbWwaENcJxmCLabrPH3hhhFf3xwdsaxLCmShUtA_BCEOWsTt_Ra59rxT_m-HyeOJ6PDwGx9HRDjUl6sepC5lCe6g3quem2QO-Bt1t7wzMZCyKjiSyfO6XOOXHWlrtPlCrXBa5A9UtxvrdBZrRCSY-JwNcpz4P6lk4FvXXpQ2HD7qVquoIdMfDl1AhUy4jAqmNR4LtyTmPizLOXs-eODUh3vHXSr3v4aCTHPaL"}
                onError={(e) => { e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBLROueBxPmAcdXUhD9cZrpBeyS08cmliZxuoQQ5QiqbWwaENcJxmCLabrPH3hhhFf3xwdsaxLCmShUtA_BCEOWsTt_Ra59rxT_m-HyeOJ6PDwGx9HRDjUl6sepC5lCe6g3quem2QO-Bt1t7wzMZCyKjiSyfO6XOOXHWlrtPlCrXBa5A9UtxvrdBZrRCSY-JwNcpz4P6lk4FvXXpQ2HD7qVquoIdMfDl1AhUy4jAqmNR4LtyTmPizLOXs-eODUh3vHXSr3v4aCTHPaL" }}
              />
              
              {post.type === 'live' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-lime-400/20 backdrop-blur-md rounded-full flex items-center justify-center border border-lime-400/50 hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lime-400 text-4xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              )}

              {post.tags && (
                <div className="absolute top-4 right-4 bg-lime-400 text-black px-3 py-1 rounded-full font-label-bold text-[10px] uppercase tracking-widest kinetic-glow">
                  {post.tags}
                </div>
              )}
            </div>

            <div className="p-container-padding space-y-3">
              <h2 className="font-headline-md text-lime-400">{post.title}</h2>
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
                  <button onClick={() => openComments(post.id)} className="flex items-center gap-2 text-zinc-400 hover:text-lime-400 transition-colors active:scale-95">
                    <span className="material-symbols-outlined">chat</span>
                    <span className="font-label-bold text-label-bold">{post.comments_count}</span>
                  </button>
                  <button className="flex items-center gap-2 text-zinc-400 active:scale-95">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
                <button className="text-zinc-500 active:scale-95 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">bookmark</span>
                </button>
              </div>
            </div>
          </article>
        ))
      )}

      {/* Floating Create Post Button */}
      <button 
        onClick={() => setShowPostModal(true)} 
        className="fixed bottom-32 right-8 w-14 h-14 bg-lime-400 text-black rounded-2xl shadow-[0_0_30px_rgba(204,255,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </button>

      {/* CREATE POST MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPostModal(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-8 duration-200">
            <h2 className="text-xl font-headline-md text-white mb-4 uppercase">New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <input required type="text" placeholder="Title" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="w-full bg-zinc-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400" />
              </div>
              <div>
                <textarea required placeholder="Caption..." value={postForm.description} onChange={e => setPostForm({...postForm, description: e.target.value})} className="w-full h-24 bg-zinc-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400 resize-none"></textarea>
              </div>
              <div>
                <input type="text" placeholder="Media URL (Image / MP4)" value={postForm.media_url} onChange={e => setPostForm({...postForm, media_url: e.target.value})} className="w-full bg-zinc-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400 text-sm" />
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Tags (e.g. HIIT)" value={postForm.tags} onChange={e => setPostForm({...postForm, tags: e.target.value})} className="w-1/2 bg-zinc-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400 text-sm" />
                <select value={postForm.type} onChange={e => setPostForm({...postForm, type: e.target.value})} className="w-1/2 bg-zinc-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-lime-400 text-sm">
                  <option value="static">Static</option>
                  <option value="live">Live Video</option>
                </select>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowPostModal(false)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-lime-400 text-black font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-105 active:scale-95 transition-all">Share</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL BOTTOM SHEET */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCommentsModal(null)}></div>
          <div className="relative bg-zinc-900 border-t border-white/10 w-full max-w-2xl h-[70vh] rounded-t-[32px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 flex flex-col items-center border-b border-white/5 sticky top-0 bg-zinc-900/90 z-10 backdrop-blur-md rounded-t-[32px]">
              <div className="w-12 h-1 bg-white/20 rounded-full mb-3 cursor-pointer" onClick={() => setShowCommentsModal(null)}></div>
              <h2 className="text-white font-headline-md uppercase text-center">Comments</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingComments ? (
                <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-lime-400">refresh</span></div>
              ) : comments.length === 0 ? (
                <div className="text-center text-zinc-500 font-label-bold uppercase text-[10px]">No comments yet</div>
              ) : (
                comments.map((c, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`} className="w-full h-full object-cover" alt="User" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-zinc-800/50 rounded-2xl p-3 border border-white/5">
                        <span className="text-zinc-400 font-bold text-xs">{c.username}</span>
                        <p className="text-white text-sm mt-1">{c.comment}</p>
                      </div>
                      <span className="text-[10px] text-zinc-600 block mt-1 ml-2">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-zinc-950">
              <form onSubmit={postComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  placeholder="Drop a comment..." 
                  className="flex-1 bg-zinc-900 border border-white/10 text-white rounded-full py-3 px-5 focus:outline-none focus:border-lime-400 transition-colors text-sm"
                />
                <button type="submit" disabled={!newComment.trim()} className="w-12 h-12 bg-lime-400 text-black rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform hover:bg-lime-300">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
