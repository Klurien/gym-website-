import React, { useState, useEffect } from 'react';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(null);
  
  // Load posts from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('kinetic_community') || '[]');
    if (saved.length === 0) {
      // Demo posts
      setPosts([
        { id: 1, userId: 'demo', username: 'Coach Mike', avatar: '', content: 'Just crushed a new PR! Deadlift 315lbs x 5 reps. Consistency is key everyone! 💪', time: '2h ago', likes: 24, replies: 5, liked: false, reposts: 3 },
        { id: 2, userId: 'demo2', username: 'Sarah Fitness', avatar: '', content: 'Morning cardio done! Who else is on the early bird grind? Tag someone who motivates you! 🏃‍♀️', time: '4h ago', likes: 18, replies: 12, liked: false, reposts: 2 },
        { id: 3, userId: 'demo3', username: 'Gym Bro', avatar: '', content: 'Remember: Rest days are just as important as training days. Listen to your body!', time: '6h ago', likes: 45, replies: 8, liked: false, reposts: 7 },
      ]);
    } else {
      setPosts(saved);
    }
  }, []);
  
  // Save posts
  useEffect(() => {
    if (posts.length > 3 || (posts.length > 0 && !posts[0]?.userId?.startsWith('demo'))) {
      localStorage.setItem('kinetic_community', JSON.stringify(posts));
    }
  }, [posts]);

  const createPost = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    
    const post = {
      id: Date.now(),
      userId: user.id || 'user',
      username: user.username || 'Anonymous',
      avatar: user.profile_pic || '',
      content: newPost,
      time: 'Just now',
      likes: 0,
      replies: 0,
      liked: false,
      reposts: 0,
      replies_list: []
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const toggleLike = (postId) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const addReply = (postId) => {
    if (!replyText.trim()) return;
    
    const reply = {
      id: Date.now(),
      userId: user.id || 'user',
      username: user.username || 'You',
      avatar: user.profile_pic || '',
      content: replyText,
      time: 'Just now'
    };
    
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          replies: p.replies + 1,
          replies_list: [...(p.replies_list || []), reply]
        };
      }
      return p;
    }));
    
    setReplyText('');
    setReplyTo(null);
  };

  const getAvatar = (post) => {
    if (post.avatar) return post.avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`;
  };

  return (
    <main className="pt-28 pb-32 max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">Community</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">KINETIC Feed</p>
      </header>

      {/* Compose Post */}
      <div className="border-b border-white/5 p-4">
        <div className="flex gap-3">
          <img 
            src={user.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            className="w-10 h-10 rounded-full bg-zinc-800"
            alt="Your avatar"
          />
          <form onSubmit={createPost} className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's happening at the gym?"
              className="w-full bg-transparent text-white resize-none outline-none text-lg placeholder:text-zinc-600 min-h-[80px]"
              rows={3}
            />
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <div className="flex gap-2 text-lime-400">
                <button type="button" className="p-2 hover:bg-lime-400/10 rounded-full transition-colors">
                  <span className="material-symbols-outlined">image</span>
                </button>
                <button type="button" className="p-2 hover:bg-lime-400/10 rounded-full transition-colors">
                  <span className="material-symbols-outlined">gif_box</span>
                </button>
              </div>
              <button 
                type="submit"
                disabled={!newPost.trim()}
                className="bg-lime-400 text-black font-black px-6 py-2 rounded-full disabled:opacity-50 hover:bg-lime-300 transition-colors"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="divide-y divide-white/5">
        {posts.map(post => (
          <article key={post.id} className="p-4 hover:bg-white/[0.02] transition-colors">
            {/* Main Post */}
            <div className="flex gap-3">
              <img 
                src={getAvatar(post)}
                className="w-10 h-10 rounded-full bg-zinc-800"
                alt={post.username}
              />
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{post.username}</span>
                  <span className="text-zinc-500 text-sm">@{post.username.toLowerCase().replace(/\s/g, '')}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500 text-sm">{post.time}</span>
                </div>
                
                {/* Content */}
                <p className="text-white mt-1 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                
                {/* Actions */}
                <div className="flex justify-between mt-3 max-w-md">
                  <button 
                    onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors group"
                  >
                    <span className="material-symbols-outlined p-2 rounded-full group-hover:bg-blue-400/10">chat_bubble_outline</span>
                    <span className="text-sm">{post.replies}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 text-zinc-500 hover:text-green-400 transition-colors group">
                    <span className="material-symbols-outlined p-2 rounded-full group-hover:bg-green-400/10">repeat</span>
                    <span className="text-sm">{post.reposts}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors group ${post.liked ? 'text-red-500' : 'hover:text-red-500'}`}
                  >
                    <span className={`material-symbols-outlined p-2 rounded-full ${post.liked ? 'bg-red-500/10' : 'group-hover:bg-red-500/10'}`}>
                      {post.liked ? 'favorite' : 'favorite_border'}
                    </span>
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors p-2 rounded-full hover:bg-zinc-800">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Reply Form */}
            {replyTo === post.id && (
              <div className="mt-4 ml-12 flex gap-3">
                <img 
                  src={user.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  className="w-8 h-8 rounded-full bg-zinc-800"
                  alt="You"
                />
                <div className="flex-1">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Post your reply..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-white resize-none outline-none focus:border-lime-400 transition-colors"
                    rows={2}
                  />
                  <div className="flex justify-end gap-3 mt-2">
                    <button 
                      onClick={() => { setReplyTo(null); setReplyText(''); }}
                      className="px-4 py-2 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => addReply(post.id)}
                      disabled={!replyText.trim()}
                      className="bg-lime-400 text-black font-black px-6 py-2 rounded-full disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show Replies Toggle */}
            {post.replies_list?.length > 0 && (
              <button 
                onClick={() => setShowReplies(showReplies === post.id ? null : post.id)}
                className="mt-3 ml-12 text-lime-400 text-sm font-bold hover:underline"
              >
                {showReplies === post.id ? 'Hide replies' : `Show ${post.replies} replies`}
              </button>
            )}
            
            {/* Replies */}
            {showReplies === post.id && post.replies_list?.map(reply => (
              <div key={reply.id} className="mt-4 ml-12 flex gap-3 bg-zinc-900/30 rounded-2xl p-4">
                <img 
                  src={getAvatar(reply)}
                  className="w-8 h-8 rounded-full bg-zinc-800"
                  alt={reply.username}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{reply.username}</span>
                    <span className="text-zinc-500 text-xs">{reply.time}</span>
                  </div>
                  <p className="text-white text-sm mt-1">{reply.content}</p>
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>

      {/* Loading indicator */}
      {posts.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <span className="material-symbols-outlined text-5xl mb-4">forum</span>
          <p className="text-sm font-bold uppercase tracking-widest">No posts yet</p>
          <p className="text-xs text-zinc-600 mt-2">Be the first to post!</p>
        </div>
      )}
    </main>
  );
}