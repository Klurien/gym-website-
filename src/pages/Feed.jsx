import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };
  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(null); // stores post_id or null
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setPostForm(prev => ({
          ...prev,
          media_url: data.url,
          type: file.type.startsWith('video/') ? 'video' : 'static'
        }));
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
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
    <main className="h-screen w-full bg-black overflow-hidden flex flex-col">
      {/* Immersive Header (Static) */}
      <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-black/80 to-transparent shrink-0 z-20">
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
          {greeting()}, <span className="text-lime-400">{user.username || 'Member'}</span>
        </h1>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-2">Elite Global Feed</p>
      </header>

      {/* TikTok Style Vertical Snap Container */}
      <div className="flex-1 overflow-y-auto scroll-snap-y-mandatory hide-scrollbar pb-32">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-lime-400 text-4xl">refresh</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold gap-4">
            <span className="material-symbols-outlined text-4xl opacity-30">movie_filter</span>
            No Elite Clips Yet
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="relative h-[calc(100vh-160px)] w-full snap-start overflow-hidden border-b border-white/5 bg-zinc-900 flex flex-col">
              {/* Media Background Layer */}
              <div className="absolute inset-0 z-0 bg-stone-950">
                {post.media_url?.match(/\.(mp4|webm|ogg|mov)$|video/i) ? (
                  <video
                    src={post.media_url.startsWith('http') ? post.media_url : `https://${post.media_url}`}
                    className="w-full h-full object-cover relative z-10"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={post.media_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"}
                    className="w-full h-full object-cover relative z-10"
                    alt={post.title}
                  />
                )}
                {/* Fixed Overlay: Ensure it doesn't block the video layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20 pointer-events-none"></div>
              </div>

              {/* Interaction Layer: Branding & Text (z-30) */}
              <div className="absolute inset-0 z-30 pointer-events-none p-6 flex flex-col justify-end">
                <div className="mb-24 flex flex-col gap-3">
                  <div className="flex items-center gap-2 pointer-events-auto w-fit">
                    <div className="w-9 h-9 rounded-full border-2 border-lime-400 overflow-hidden shadow-2xl">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.trainer_name}`} className="w-full h-full" alt="Trainer" />
                    </div>
                    <span className="text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">@{post.trainer_name || 'Elite'}</span>
                  </div>
                  
                  <div className="max-w-[80%] pointer-events-auto">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-2xl">{post.title}</h2>
                    <p className="text-[11px] text-zinc-300 font-medium leading-relaxed line-clamp-2 drop-shadow-xl">{post.description}</p>
                    {post.tags && (
                      <span className="inline-block mt-2 bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-lime-400/30">
                        #{post.tags}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Side Action Bar (Vertical) */}
              <div className="absolute right-4 bottom-12 z-20 flex flex-col gap-6 items-center">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleLike(post.id, post.is_liked)}
                    className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all active:scale-75 shadow-2xl ${post.is_liked ? 'bg-lime-400 text-black shadow-lime-400/30' : 'bg-black/40 text-white border border-white/10'}`}
                  >
                    <span className="material-symbols-outlined font-black" style={post.is_liked ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                  </button>
                  <span className="text-[10px] font-black text-white tracking-widest drop-shadow-md">{post.likes_count || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => openComments(post.id)}
                    className="w-12 h-12 bg-black/40 backdrop-blur-xl text-white rounded-full flex items-center justify-center border border-white/10 shadow-2xl active:scale-75"
                  >
                    <span className="material-symbols-outlined font-black">forum</span>
                  </button>
                  <span className="text-[10px] font-black text-white tracking-widest drop-shadow-md">{post.comments_count || 0}</span>
                </div>

                <button className="w-12 h-12 bg-black/40 backdrop-blur-xl text-white rounded-full flex items-center justify-center border border-white/10 shadow-2xl active:scale-75">
                  <span className="material-symbols-outlined font-black">share</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Create Post Button */}
      {user.role === 'admin' && (
        <button
          onClick={() => setShowPostModal(true)}
          className="fixed bottom-32 right-6 w-14 h-14 bg-lime-400 text-black rounded-2xl shadow-[0_10px_40px_rgba(204,255,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
        >
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>
      )}

      {/* Modals (Portal-like) */}
      {showPostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowPostModal(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-[32px] p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">New Global Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <input required type="text" placeholder="Post Title" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-lime-400 transition-all outline-none" />
              <textarea required placeholder="Caption..." value={postForm.description} onChange={e => setPostForm({ ...postForm, description: e.target.value })} className="w-full h-24 bg-black/40 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-lime-400 resize-none outline-none"></textarea>
              {/* Redesigned Media Selection Area */}
              <div className="space-y-4">
                <label 
                  htmlFor="media-upload" 
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[24px] p-8 transition-all group cursor-pointer ${postForm.media_url && !uploading ? 'border-lime-400 bg-lime-400/5' : 'border-white/10 bg-black/20 hover:border-lime-400/50'}`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined animate-spin text-4xl text-lime-400">refresh</span>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Processing...</span>
                    </div>
                  ) : postForm.media_url ? (
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-lime-400">check_circle</span>
                      <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">Media Attached</span>
                      <span className="text-[8px] text-zinc-500 truncate max-w-[200px]">{postForm.media_url.split('/').pop()}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-zinc-500 group-hover:text-lime-400 transition-colors">add_a_photo</span>
                      <div className="text-center">
                        <span className="block text-[10px] font-black text-white uppercase tracking-widest">Choose Elite Media</span>
                        <span className="block text-[8px] text-zinc-500 uppercase tracking-widest mt-1 text-zinc-500/80">Tap to browse gallery</span>
                      </div>
                    </div>
                  )}
                  <input id="media-upload" type="file" onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                     <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">OR</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="External Media URL..." 
                    value={postForm.media_url} 
                    onChange={e => {
                      const url = e.target.value;
                      const type = url.match(/\.(mp4|webm|ogg|mov)$|video/i) ? 'video' : 'static';
                      setPostForm({ ...postForm, media_url: url, type });
                    }} 
                    className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 focus:border-lime-400 text-xs outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowPostModal(false)} className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-2xl hover:bg-zinc-700 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-lime-400 text-black font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommentsModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCommentsModal(null)}></div>
          <div className="relative bg-zinc-900 border-t border-white/10 w-full max-w-2xl h-[70vh] rounded-t-[32px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 flex flex-col items-center border-b border-white/5 sticky top-0 bg-zinc-900/90 z-10">
              <div className="w-12 h-1 bg-white/20 rounded-full mb-3 cursor-pointer" onClick={() => setShowCommentsModal(null)}></div>
              <h2 className="text-white font-black uppercase text-sm tracking-widest">Post Comments</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingComments ? (
                <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-lime-400">refresh</span></div>
              ) : comments.length === 0 ? (
                <div className="text-center text-zinc-500 font-bold uppercase text-[9px] tracking-[0.3em] py-20">No Elite Feedback Yet</div>
              ) : (
                comments.map((c, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`} className="w-full h-full" alt="User" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner">
                        <span className="text-lime-400 font-black text-[10px] uppercase tracking-widest">{c.username}</span>
                        <p className="text-white text-sm mt-1 font-body-md leading-relaxed">{c.comment}</p>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-2 ml-2">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-zinc-950 pb-10">
              <form onSubmit={postComment} className="flex gap-2 bg-zinc-900 rounded-full p-1 border border-white/10 ring-2 ring-transparent focus-within:ring-lime-400/20 transition-all">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1 bg-transparent text-white rounded-full py-3 px-6 outline-none text-sm"
                />
                <button type="submit" disabled={!newComment.trim()} className="w-12 h-12 bg-lime-400 text-black rounded-full flex items-center justify-center shrink-0 disabled:opacity-90 active:scale-90 transition-all">
                  <span className="material-symbols-outlined font-black">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
