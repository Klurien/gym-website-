import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [commentsModal, setCommentsModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [shareModal, setShareModal] = useState(null);

  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

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

      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        console.error('Failed to fetch posts:', res.status);
      }
    } catch (e) {
      console.error('Error fetching posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'document';
    const reader = new FileReader();
    reader.onload = (ev) => { setMediaPreview(ev.target.result); setMediaType(type); setMediaFile(file); };
    reader.readAsDataURL(file);
  };

  const uploadMedia = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return '';
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !mediaFile) return;

    setIsPosting(true);
    const token = localStorage.getItem('token');

    try {
      let mediaUrl = '';
      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: newPost,
          media_url: mediaUrl,
          type: mediaType === 'video' ? 'video' : 'static',
          description: newPost,
          tags: ''
        })
      });

      if (res.ok) {
        setNewPost('');
        setMediaPreview(null);
        setMediaType(null);
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create post');
      }
    } catch (e) {
      console.error('Error creating post:', e);
      alert('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/posts_social?action=like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ post_id: postId })
      });
      fetchPosts();
    } catch (e) {
      console.error('Error toggling like:', e);
    }
  };

  const addComment = async (postId) => {
    if (!replyText.trim()) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/posts_social?action=comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ post_id: postId, comment: replyText })
      });

      if (res.ok) {
        setReplyText('');
        fetchPosts();
      }
    } catch (e) {
      console.error('Error adding comment:', e);
    }
  };

  const openComments = async (post) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/posts_social?action=comments&post_id=${post.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const comments = await res.json();
        setCommentsModal({ ...post, comments });
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
    }
  };

  const getAvatar = (item) => {
    if (!item) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
    return item.profile_pic || item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username || 'default'}`;
  };

  if (loading) {
    return <div className="pt-28 text-center text-zinc-500">Loading...</div>;
  }

  return (
    <main className="pt-28 pb-32 max-w-lg mx-auto">
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <h1 className="text-xl font-black text-white uppercase">KINETIC</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase">Community Feed</p>
      </header>

      {/* Compose */}
      {(user.role === 'admin' || user.role === 'trainer') && (
        <div className="border-b border-white/5 p-4">
          <div className="flex gap-3">
            <img src={getAvatar(user)} className="w-10 h-10 rounded-full bg-zinc-800" alt="You" />
            <form onSubmit={createPost} className="flex-1">
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="What's happening?"
                className="w-full bg-transparent text-white resize-none outline-none text-lg min-h-[60px]" />
              {mediaPreview && (
                <div className="mt-3 rounded-2xl overflow-hidden relative">
                  {mediaType === 'video' ? <video src={mediaPreview} className="w-full max-h-64" controls /> :
                    mediaType === 'image' ? <img src={mediaPreview} className="w-full max-h-64" /> :
                      <div className="p-4 flex items-center gap-2"><span className="material-symbols-outlined text-red-500">description</span><span className="text-white">{mediaFile?.name}</span></div>}
                  <button type="button" onClick={() => { setMediaPreview(null); setMediaFile(null); }} className="absolute top-2 right-2 bg-black/70 p-1 rounded-full">
                    <span className="material-symbols-outlined text-white">close</span>
                  </button>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <div className="flex text-lime-400">
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-lime-400/10 rounded-full">
                    <span className="material-symbols-outlined">image</span>
                  </button>
                </div>
                <button type="submit" disabled={(!newPost.trim() && !mediaFile) || isPosting}
                  className="bg-lime-400 text-black font-black px-6 py-2 rounded-full disabled:opacity-50">
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="divide-y divide-white/5">
        {posts.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">No posts yet. Be the first to post!</p>
        ) : (
          posts.map(post => (
            <article key={post.id} className="p-4">
              <div className="flex gap-3">
                <img src={getAvatar(post)} className="w-10 h-10 rounded-full bg-zinc-800" alt={post.trainer_name} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{post.trainer_name}</span>
                    <span className="text-zinc-500 text-sm">@{post.trainer_name?.toLowerCase()}</span>
                  </div>
                  <p className="text-white mt-1">{post.title}</p>
                  {post.media_url && (
                    <div className="mt-3 rounded-2xl overflow-hidden">
                      {post.type === 'video' ? <video src={post.media_url} className="w-full" controls /> :
                        <img src={post.media_url} className="w-full" />}
                    </div>
                  )}
                  <div className="flex justify-between mt-3 max-w-md">
                    <button onClick={() => openComments(post)} className="flex items-center gap-2 text-zinc-500 hover:text-blue-400">
                      <span className="material-symbols-outlined p-2">chat_bubble_outline</span>
                      <span className="text-sm">{post.comments_count || 0}</span>
                    </button>
                    <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-2 ${post.is_liked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}>
                      <span className="material-symbols-outlined p-2">{post.is_liked ? 'favorite' : 'favorite_border'}</span>
                      <span className="text-sm">{post.likes_count || 0}</span>
                    </button>
                    <button onClick={() => setShareModal(post)} className="text-zinc-500 p-2">
                      <span className="material-symbols-outlined">ios_share</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Comments Modal */}
      {commentsModal && (
        <div className="fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setCommentsModal(null)}></div>
          <div className="relative w-full h-[85%] bg-zinc-900 rounded-t-[30px] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <h3 className="font-black text-white uppercase">Comments ({commentsModal.comments?.length || 0})</h3>
              <button onClick={() => setCommentsModal(null)}><span className="material-symbols-outlined text-white">close</span></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {commentsModal.comments?.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">No comments yet. Be the first!</p>
              ) : (
                commentsModal.comments?.map(comment => (
                  <div key={comment.id} className="flex gap-3 bg-zinc-800/50 p-3 rounded-2xl">
                    <img src={getAvatar(comment)} className="w-8 h-8 rounded-full" alt={comment.username} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{comment.username}</span>
                      </div>
                      <p className="text-white text-sm mt-1">{comment.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5">
              <div className="flex gap-3">
                <img src={getAvatar(user)} className="w-8 h-8 rounded-full" alt="You" />
                <div className="flex-1 flex gap-2">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Add a comment..."
                    className="flex-1 bg-zinc-800 text-white rounded-2xl p-3 text-sm resize-none outline-none" rows={1} />
                  <button onClick={() => { addComment(commentsModal.id); setCommentsModal({ ...commentsModal, comments: [...(commentsModal.comments || []), { id: Date.now(), username: user.username, comment: replyText }] }); }}
                    disabled={!replyText.trim()} className="bg-lime-400 text-black font-bold px-4 rounded-2xl disabled:opacity-50">
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShareModal(null)}></div>
          <div className="relative w-full bg-zinc-900 rounded-t-[30px] p-6">
            <h3 className="text-lg font-black text-white uppercase mb-6">Share Post</h3>
            <div className="grid grid-cols-4 gap-4">
              <button
                onClick={async () => {
                  try {
                    await navigator.share({ title: 'KINETIC Post', text: shareModal.title + '\n\n' + window.location.origin });
                  } catch { navigator.clipboard.writeText(shareModal.title + '\n\n' + window.location.origin); setShareModal(null); }
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-black text-2xl">share</span>
                </div>
                <span className="text-xs text-white">Share</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.title + '\n\n' + window.location.origin);
                  alert('Link copied to clipboard!');
                  setShareModal(null);
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">link</span>
                </div>
                <span className="text-xs text-white">Copy Link</span>
              </button>

              <button
                onClick={() => {
                  const text = encodeURIComponent(shareModal.title);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                  setShareModal(null);
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">chat</span>
                </div>
                <span className="text-xs text-white">WhatsApp</span>
              </button>
            </div>
            <button onClick={() => setShareModal(null)} className="w-full bg-zinc-800 text-white font-bold py-4 rounded-full mt-6">Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}
