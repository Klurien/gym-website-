import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RichMedia from '../components/RichMedia';
import RichText from '../components/RichText';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };
  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [shareModal, setShareModal] = useState(null);
  const fileInputRef = useRef(null);

  // Post form state
  const [postForm, setPostForm] = useState({ title: '', description: '', media_url: '', tags: '', type: 'static' });

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (location.search.includes('action=compose')) {
      setShowPostModal(true);
      navigate('/feed', { replace: true });
    }
  }, [location.search, navigate]);

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
      
      if (res.status === 404 || res.status === 405 || !res.ok) {
        setPosts([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      setPosts([]);
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

  const handleShare = (post) => {
    setShareModal(post);
  };

  const doNativeShare = async (post) => {
    try {
      await navigator.share({
        title: post.title,
        text: `${post.description || post.title} - KINETIC`,
        url: window.location.origin + '/feed'
      });
    } catch {
      copyLink(post);
    }
    setShareModal(null);
  };

  const copyLink = (post) => {
    navigator.clipboard.writeText(`${window.location.origin}/feed\n\n${post.title}: ${post.description || ''}`);
    alert('Link copied!');
    setShareModal(null);
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
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to create post. Please try again.');
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
      <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-black/90 to-transparent shrink-0 z-20 animate-fade-in">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none text-glow-lime">
          {greeting()}, <span className="text-lime-400">{user.username || 'Member'}</span>
        </h1>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] mt-3 ml-1 opacity-60">Elite Global Feed</p>
      </header>

      {/* TikTok Style Vertical Snap Container */}
      <div className="flex-1 overflow-y-auto scroll-snap-y-mandatory hide-scrollbar pb-32">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 animate-pulse-soft">
            <span className="material-symbols-outlined text-lime-400 text-5xl">stream</span>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Establishing Link...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold gap-6 animate-fade-in text-center px-10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-4xl opacity-20">movie_filter</span>
            </div>
            The feed is currently quiet.<br />Be the first to post to the elite community.
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="relative h-[calc(100vh-160px)] w-full snap-start overflow-hidden border-b border-white/5 bg-black flex flex-col">
              {/* Media Background Layer */}
              <div className="absolute inset-0 z-0 select-none">
                <RichMedia 
                  url={post.media_url} 
                  type={post.type} 
                  title={post.title} 
                  description={post.description} 
                  immersive={true}
                />
                {/* Fixed Overlay: Ensure it doesn't block the video layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-20 pointer-events-none"></div>
              </div>

              {/* Interaction Layer: Branding & Text (z-30) */}
              <div className="absolute inset-0 z-30 pointer-events-none p-8 flex flex-col justify-end animate-slide-up">
                <div className="mb-24 flex flex-col gap-5">
                  <div className="flex items-center gap-3 pointer-events-auto w-fit bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 hover:bg-black/60 transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-full border border-lime-400/50 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.trainer_name}`} className="w-full h-full" alt="Trainer" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">@{post.trainer_name || 'Elite'}</span>
                  </div>
                  
                  <div className="max-w-[85%] pointer-events-auto">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 leading-none drop-shadow-2xl">{post.title}</h2>
                    <RichText text={post.description} className="text-xs text-zinc-300 font-medium leading-relaxed line-clamp-2 drop-shadow-xl opacity-80" />
                    {post.tags && (
                      <span className="inline-block mt-4 bg-lime-400/10 text-lime-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-lime-400/20 backdrop-blur-sm">
                        #{post.tags}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Side Action Bar (Vertical) */}
              <div className="absolute right-6 bottom-16 z-40 flex flex-col gap-8 items-center pointer-events-auto">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleLike(post.id, post.is_liked)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-75 shadow-2xl kinetic-hover ${post.is_liked ? 'bg-lime-400 text-black shadow-lime-400/30' : 'bg-black/40 text-white border border-white/10 backdrop-blur-xl hover:bg-white/10'}`}
                  >
                    <span className="material-symbols-outlined font-black text-2xl" style={post.is_liked ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                  </button>
                  <span className="text-[10px] font-black text-white tracking-widest drop-shadow-md opacity-70">{post.likes_count || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => openComments(post.id)}
                    className="w-14 h-14 bg-black/40 backdrop-blur-xl text-white rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl active:scale-75 kinetic-hover hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined font-black text-2xl">forum</span>
                  </button>
                  <span className="text-[10px] font-black text-white tracking-widest drop-shadow-md opacity-70">{post.comments_count || 0}</span>
                </div>

                <button 
                    onClick={() => handleShare(post)}
                    className="w-14 h-14 bg-black/40 backdrop-blur-xl text-white rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl active:scale-75 kinetic-hover hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined font-black text-2xl">share</span>
                  </button>

                  {shareModal && (
                    <div className="fixed inset-0 z-[100] flex items-end">
                      <div className="absolute inset-0 bg-black/80" onClick={() => setShareModal(null)}></div>
                      <div className="relative w-full bg-zinc-900 rounded-t-[30px] p-6 animate-slide-up">
                        <h3 className="text-lg font-black text-white uppercase mb-6">Share Post</h3>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                          <button onClick={() => doNativeShare(post)} className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-black text-2xl">share</span>
                            </div>
                            <span className="text-xs text-white">Apps</span>
                          </button>
                          <button onClick={() => copyLink(post)} className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-2xl">link</span>
                            </div>
                            <span className="text-xs text-white">Copy</span>
                          </button>
                        </div>
                        <button onClick={() => setShareModal(null)} className="w-full bg-zinc-800 text-white font-bold py-4 rounded-full">Cancel</button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals (Portal-like) */}
      {showPostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowPostModal(false)}></div>
          <div className="relative bg-zinc-950 border border-white/10 rounded-[40px] p-8 w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,1)] ring-1 ring-white/5 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">Create Elite Post</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                  <span className="text-[10px] font-black text-lime-400 uppercase tracking-[0.2em]">Global Broadcast</span>
                </div>
              </div>
              <button 
                onClick={() => setShowPostModal(false)}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
              >
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-white transition-colors">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Campaign Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. MORNING GRIND" 
                  value={postForm.title} 
                  onChange={e => setPostForm({ ...postForm, title: e.target.value })} 
                  className="w-full bg-zinc-900/50 border border-white/5 text-white rounded-2xl py-4 px-6 focus:border-lime-400/50 focus:ring-4 focus:ring-lime-400/5 transition-all outline-none font-bold placeholder:text-zinc-700" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Elite Description</label>
                <textarea 
                  required 
                  placeholder="Forge your legacy..." 
                  value={postForm.description} 
                  onChange={e => setPostForm({ ...postForm, description: e.target.value })} 
                  className="w-full h-32 bg-zinc-900/50 border border-white/5 text-white rounded-2xl py-4 px-6 focus:border-lime-400/50 focus:ring-4 focus:ring-lime-400/5 resize-none outline-none font-medium placeholder:text-zinc-700"
                ></textarea>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Media Asset</label>
                <label 
                  htmlFor="media-upload" 
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[32px] p-10 transition-all group cursor-pointer relative overflow-hidden ${postForm.media_url && !uploading ? 'border-lime-400 bg-lime-400/5' : 'border-white/5 bg-zinc-900/30 hover:border-white/20'}`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="w-16 h-16 border-4 border-lime-400/20 border-t-lime-400 rounded-full animate-spin"></div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Uploading Content...</span>
                    </div>
                  ) : postForm.media_url ? (
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/20">
                        <span className="material-symbols-outlined text-black text-3xl font-bold">check</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-black text-lime-400 uppercase tracking-[0.2em]">Asset Secured</span>
                        <span className="block text-[8px] text-zinc-500 mt-1 font-mono uppercase opacity-60">Ready for broadcast</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-5 relative z-10">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/5 group-hover:bg-lime-400 transition-all duration-500">
                        <span className="material-symbols-outlined text-4xl text-zinc-500 group-hover:text-black transition-colors">upload_file</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-black text-white uppercase tracking-widest">Select Elite Media</span>
                        <span className="block text-[9px] text-zinc-500 uppercase tracking-[0.1em] mt-2 group-hover:text-zinc-400 transition-colors">Video (mp4) or Image (jpg/png)</span>
                      </div>
                    </div>
                  )}
                  <input id="media-upload" type="file" onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                </label>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">Alternative</span>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 material-symbols-outlined text-lg group-focus-within:text-lime-400 transition-colors">link</span>
                  <input 
                    type="text" 
                    placeholder="Enter Content URL..." 
                    value={postForm.media_url} 
                    onChange={e => {
                      const url = e.target.value;
                      const type = url.match(/\.(mp4|webm|ogg|mov)$|video/i) ? 'video' : 'static';
                      setPostForm({ ...postForm, media_url: url, type });
                    }} 
                    className="w-full bg-zinc-900/50 border border-white/5 text-white rounded-2xl py-5 pl-14 pr-6 focus:border-lime-400/50 outline-none text-[11px] font-bold transition-all placeholder:text-zinc-700" 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowPostModal(false)} 
                  className="flex-1 bg-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest py-6 rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/5"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={uploading || !postForm.title}
                  className="flex-1 bg-lime-400 text-black font-black text-[10px] uppercase tracking-widest py-6 rounded-2xl shadow-[0_20px_40px_rgba(163,230,53,0.15)] hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:translate-y-0"
                >
                  Publish Post
                </button>
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
