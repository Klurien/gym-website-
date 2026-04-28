import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [], videos: [] });
  const [recentSearches, setRecentSearches] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showProfile, setShowProfile] = useState(null);
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Load users
    const saved = JSON.parse(localStorage.getItem('kinetic_users') || '[]');
    if (saved.length === 0) {
      setAllUsers([
        { id: '1', username: 'Coach Mike', bio: 'Pro Trainer | 10yr exp', followers: 2400, following: 156, posts: 89, avatar: '' },
        { id: '2', username: 'Sarah Fitness', bio: 'Fitness enthusiast 💪', followers: 890, following: 234, posts: 45, avatar: '' },
        { id: '3', username: 'GymBro Max', bio: 'Lifting heavy 🏋️', followers: 567, following: 123, posts: 78, avatar: '' },
        { id: '4', username: 'Yoga Life', bio: 'Mind & Body', followers: 1200, following: 400, posts: 156, avatar: '' },
      ]);
    } else {
      setAllUsers(saved);
    }
    
     // Load posts for search
    setAllPosts([
      { id: 1, userId: 'demo', username: 'Coach Mike', content: 'Just crushed a new PR! Deadlift 315lbs x 5 reps. Consistency is key everyone! 💪', media_type: '' },
      { id: 2, userId: 'demo2', username: 'Sarah Fitness', content: 'Morning cardio done! Who else is on the early bird grind?', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' },
    ]);
    
    setFollowing(JSON.parse(localStorage.getItem('kinetic_following') || '[]'));
    setRecentSearches(JSON.parse(localStorage.getItem('kinetic_recent_searches') || '[]'));
  }, []);

  const fuzzySearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ users: [], posts: [], videos: [] });
      return;
    }
    
    const q = searchQuery.toLowerCase();
    
    // Search users
    const userMatches = allUsers.filter(user => 
      user.username.toLowerCase().includes(q)
    );
    
    // Search posts (content)
    const postMatches = allPosts.filter(post => 
      post.content?.toLowerCase().includes(q)
    );
    
    // Search videos (posts with media_url and video type or .mp4 extension)
    const videoMatches = allPosts.filter(post => 
      post.media_type === 'video' || 
      post.media_url?.match(/\.(mp4|webm|ogg)$/i) ||
      post.content?.toLowerCase().includes('video') ||
      post.content?.toLowerCase().includes('workout') ||
      post.content?.toLowerCase().includes('exercise')
    );
    
    setResults({
      users: userMatches,
      posts: postMatches,
      videos: videoMatches
    });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    fuzzySearch(value);
  };

  const handlePostClick = (post) => {
    navigate('/community');
  };

  const handleUserClick = (user) => {
    setShowProfile(user);
  };

  const toggleFollow = (userId) => {
    setFollowing(prev => {
      const updated = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      localStorage.setItem('kinetic_following', JSON.stringify(updated));
      return updated;
    });
  };

  const getAvatar = (item) => {
    return item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`;
  };

  const isFollowing = (userId) => following.includes(userId);

  const totalResults = results.users.length + results.posts.length + results.videos.length;

  return (
    <main className="pt-28 pb-32 max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">Search</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Find Everything</p>
      </header>

      {/* Search Input */}
      <div className="p-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-500">search</span>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search users, posts, videos..."
            className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 focus:border-lime-400 outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Tabs */}
      {query && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All', count: totalResults },
            { id: 'users', label: 'People', count: results.users.length },
            { id: 'posts', label: 'Posts', count: results.posts.length },
            { id: 'videos', label: 'Videos', count: results.videos.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-lime-400 text-black' 
                  : 'bg-zinc-900/50 text-zinc-400 border border-white/5'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {query && totalResults === 0 && (
        <div className="p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-zinc-600 mb-4">search_off</span>
          <p className="text-white font-bold">No results found</p>
          <p className="text-zinc-500 text-sm mt-2">Try different keywords</p>
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="p-4 border-b border-white/5">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Recent</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, i) => (
              <button
                key={i}
                onClick={() => { setQuery(term); fuzzySearch(term); }}
                className="bg-zinc-900/50 text-zinc-400 px-4 py-2 rounded-full text-sm border border-white/5"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="divide-y divide-white/5">
        {/* Users Section */}
        {(activeTab === 'all' || activeTab === 'users') && results.users.map(user => (
          <div key={user.id} onClick={() => handleUserClick(user)} className="p-4 hover:bg-white/[0.02] cursor-pointer">
            <div className="flex items-center gap-4">
              <img src={getAvatar(user)} className="w-12 h-12 rounded-full bg-zinc-800" alt={user.username} />
              <div>
                <span className="font-bold text-white">{user.username}</span>
                <p className="text-zinc-500 text-sm">{user.bio}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Posts Section */}
        {(activeTab === 'all' || activeTab === 'posts') && results.posts.map(post => (
          <div key={post.id} onClick={handlePostClick} className="p-4 hover:bg-white/[0.02] cursor-pointer">
            <div className="flex gap-3">
              <img src={getAvatar(post)} className="w-10 h-10 rounded-full bg-zinc-800" alt={post.username} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{post.username}</span>
                  <span className="text-zinc-500 text-xs">· {post.time}</span>
                </div>
                <p className="text-white text-sm line-clamp-2">{post.content}</p>
                <div className="flex gap-4 mt-2 text-zinc-500 text-xs">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.replies}</span>
                </div>
              </div>
              {post.media_type === 'image' && (
                <img src={post.media_url} className="w-16 h-16 rounded-lg object-cover" alt="" />
              )}
            </div>
          </div>
        ))}

        {/* Videos Section */}
        {(activeTab === 'all' || activeTab === 'videos') && results.videos.map(video => (
          <div key={video.id} onClick={handlePostClick} className="p-4 hover:bg-white/[0.02] cursor-pointer">
            <div className="flex gap-3">
              <img src={getAvatar(video)} className="w-10 h-10 rounded-full bg-zinc-800" alt={video.username} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{video.username}</span>
                  <span className="text-zinc-500 text-xs">· {video.time}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {video.media_url ? (
                    <div className="relative">
                      <video src={video.media_url} className="w-24 h-16 rounded-lg object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[10px] text-white">▶</span>
                    </div>
                  ) : (
                    <span className="text-lime-400 text-sm">🎥 Video</span>
                  )}
                </div>
                <p className="text-white text-sm mt-1 line-clamp-1">{video.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State - Quick Access */}
      {!query && (
        <div className="p-4">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Quick Search</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setQuery('workout')} className="bg-zinc-900/30 p-4 rounded-2xl text-center border border-white/5 hover:border-lime-400/30">
              <span className="text-2xl mb-1">🏋️</span>
              <p className="text-white text-sm font-bold">Workouts</p>
            </button>
            <button onClick={() => setQuery('meal')} className="bg-zinc-900/30 p-4 rounded-2xl text-center border border-white/5 hover:border-lime-400/30">
              <span className="text-2xl mb-1">🥗</span>
              <p className="text-white text-sm font-bold">Nutrition</p>
            </button>
            <button onClick={() => setQuery('yoga')} className="bg-zinc-900/30 p-4 rounded-2xl text-center border border-white/5 hover:border-lime-400/30">
              <span className="text-2xl mb-1">🧘</span>
              <p className="text-white text-sm font-bold">Yoga</p>
            </button>
            <button onClick={() => setQuery('cardio')} className="bg-zinc-900/30 p-4 rounded-2xl text-center border border-white/5 hover:border-lime-400/30">
              <span className="text-2xl mb-1">🏃</span>
              <p className="text-white text-sm font-bold">Cardio</p>
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90" onClick={() => setShowProfile(null)}></div>
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[32px] p-6">
            <button onClick={() => setShowProfile(null)} className="absolute top-4 right-4 text-zinc-500">
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="text-center">
              <img src={getAvatar(showProfile)} className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-lime-400" alt={showProfile.username} />
              <h2 className="text-2xl font-black text-white">{showProfile.username}</h2>
              <p className="text-zinc-500 text-sm mt-1">{showProfile.bio}</p>
              
              <div className="flex justify-center gap-8 mt-6">
                <div><p className="text-xl font-black text-white">{showProfile.posts}</p><p className="text-[10px] text-zinc-500">Posts</p></div>
                <div><p className="text-xl font-black text-white">{showProfile.followers}</p><p className="text-[10px] text-zinc-500">Followers</p></div>
                <div><p className="text-xl font-black text-white">{showProfile.following}</p><p className="text-[10px] text-zinc-500">Following</p></div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => toggleFollow(showProfile.id)} className={`flex-1 py-3 rounded-2xl font-black uppercase ${isFollowing(showProfile.id) ? 'bg-zinc-800 text-white' : 'bg-lime-400 text-black'}`}>
                  {isFollowing(showProfile.id) ? 'Following' : 'Follow'}
                </button>
                <button onClick={() => { navigate('/messages'); setShowProfile(null); }} className="flex-1 py-3 rounded-2xl font-black bg-zinc-800 text-white">Message</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}