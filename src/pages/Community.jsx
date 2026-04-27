import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Community() {
  const [posts, setPosts] = useState([]);
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
    const saved = JSON.parse(localStorage.getItem('kinetic_community') || '[]');
    if (saved.length === 0) {
      setPosts([
        { 
          id: 1, userId: 'demo', username: 'Coach Mike', avatar: '', 
          content: 'Just crushed a new PR! Deadlift 315lbs x 5 reps. Consistency is key everyone! 💪', 
          time: '2h ago', likes: 24, replies: 5, liked: false, reposts: 3, media_url: '',
          comments: [
            { id: 1, userId: 'user2', username: 'Sarah', content: 'Amazing work! 💪', time: '1h ago' },
            { id: 2, userId: 'user3', username: 'GymBro', content: 'Congratulations coach!', time: '30m ago' }
          ]
        },
        { 
          id: 2, userId: 'demo2', username: 'Sarah Fitness', avatar: '', 
          content: 'Morning cardio done! Who else is on the early bird grind?', 
          time: '4h ago', likes: 18, replies: 12, liked: false, reposts: 2, 
          media_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', media_type: 'image',
          comments: []
        },
      ]);
    } else {
      setPosts(saved);
    }
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('kinetic_community', JSON.stringify(posts));
    }
  }, [posts]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'document';
    const reader = new FileReader();
    reader.onload = (ev) => { setMediaPreview(ev.target.result); setMediaType(type); setMediaFile(file); };
    reader.readAsDataURL(file);
  };

  const createPost = (e) => {
    e.preventDefault();
    if (!newPost.trim() && !mediaFile) return;
    setIsPosting(true);
    const post = {
      id: Date.now(), userId: user.id || 'user', username: user.username || 'Anonymous',
      avatar: user.profile_pic || '', content: newPost, media_url: mediaPreview || '',
      media_type: mediaType, time: 'Just now', likes: 0, replies: 0, liked: false, reposts: 0, comments: []
    };
    setPosts([post, ...posts]);
    setNewPost(''); setMediaPreview(null); setMediaType(null); setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsPosting(false);
  };

  const toggleLike = (postId) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleRepost = (postId) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, reposts: p.reposts + 1 } : p));
  };

  const addComment = (postId) => {
    if (!replyText.trim()) return;
    const comment = { id: Date.now(), userId: user.id || 'user', username: user.username || 'You',
      avatar: user.profile_pic || '', content: replyText, time: 'Just now' };
    setPosts(posts.map(p => p.id === postId ? { ...p, replies: p.replies + 1, comments: [...(p.comments || []), comment] } : p));
    setReplyText('');
  };

  const deleteComment = (postId, commentId) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, replies: p.replies - 1, comments: p.comments?.filter(c => c.id !== commentId) };
      }
      return p;
    }));
  };

  const getAvatar = (item) => item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`;

  const openComments = (post) => setCommentsModal(post);

  return (
    <main className="pt-28 pb-32 max-w-lg mx-auto">
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <h1 className="text-xl font-black text-white uppercase">KINETIC</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase">Community Feed</p>
      </header>

      {/* Compose */}
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
                <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-lime-400/10 rounded-full">
                  <span className="material-symbols-outlined">image</span>
                </button>
              </div>
              <button type="submit" disabled={!newPost.trim() && !mediaFile || isPosting} className="bg-lime-400 text-black font-black px-6 py-2 rounded-full disabled:opacity-50">
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Posts */}
      <div className="divide-y divide-white/5">
        {posts.map(post => (
          <article key={post.id} className="p-4">
            <div className="flex gap-3">
              <img src={getAvatar(post)} className="w-10 h-10 rounded-full bg-zinc-800" alt={post.username} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{post.username}</span>
                  <span className="text-zinc-500 text-sm">@{post.username?.toLowerCase()}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500 text-sm">{post.time}</span>
                </div>
                <p className="text-white mt-1">{post.content}</p>
                {post.media_url && (
                  <div className="mt-3 rounded-2xl overflow-hidden">
                    {post.media_type === 'video' ? <video src={post.media_url} className="w-full" controls /> :
                     <img src={post.media_url} className="w-full" />}
                  </div>
                )}
                <div className="flex justify-between mt-3 max-w-md">
                  <button onClick={() => openComments(post)} className="flex items-center gap-2 text-zinc-500 hover:text-blue-400">
                    <span className="material-symbols-outlined p-2">chat_bubble_outline</span>
                    <span className="text-sm">{post.replies}</span>
                  </button>
                  <button onClick={() => toggleRepost(post.id)} className="flex items-center gap-2 text-zinc-500 hover:text-green-400">
                    <span className="material-symbols-outlined p-2">repeat</span>
                    <span className="text-sm">{post.reposts}</span>
                  </button>
                  <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-2 ${post.liked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}>
                    <span className="material-symbols-outlined p-2">{post.liked ? 'favorite' : 'favorite_border'}</span>
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button onClick={() => setShareModal(post)} className="text-zinc-500 p-2">
                    <span className="material-symbols-outlined">ios_share</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Comments Modal */}
      {commentsModal && (
        <div className="fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setCommentsModal(null)}></div>
          <div className="relative w-full h-[85%] bg-zinc-900 rounded-t-[30px] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <h3 className="font-black text-white uppercase">Comments ({commentsModal.replies})</h3>
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
                        <span className="text-zinc-500 text-xs">{comment.time}</span>
                        {(comment.userId === user.id || user.role === 'admin') && (
                          <button onClick={() => deleteComment(commentsModal.id, comment.id)} className="ml-auto text-red-500 hover:text-red-400">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                      <p className="text-white text-sm mt-1">{comment.content}</p>
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
                  <button onClick={() => { addComment(commentsModal.id); setCommentsModal({...commentsModal, replies: commentsModal.replies + 1}); }}
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
                    await navigator.share({ title: 'KINETIC Post', text: shareModal.content + '\n\n' + window.location.origin });
                  } catch { alert('Share not supported. Link copied!'); navigator.clipboard.writeText(window.location.origin); setShareModal(null); }
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
                  navigator.clipboard.writeText(shareModal.content + '\n\n' + window.location.origin); 
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
                  const message = encodeURIComponent(shareModal.content);
                  window.open(`sms:&body=${message}`, '_blank');
                  setShareModal(null);
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">sms</span>
                </div>
                <span className="text-xs text-white">SMS</span>
              </button>
              
              <button 
                onClick={() => {
                  const text = encodeURIComponent(shareModal.content);
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