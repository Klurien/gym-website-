import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showProfile, setShowProfile] = useState(null);
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Load saved users from localStorage or create defaults
    const saved = JSON.parse(localStorage.getItem('kinetic_users') || '[]');
    if (saved.length === 0) {
      setAllUsers([
        { id: '1', username: 'Coach Mike', bio: 'Pro Trainer | 10yr exp', followers: 2400, following: 156, posts: 89, avatar: '' },
        { id: '2', username: 'Sarah Fitness', bio: 'Fitness enthusiast 💪', followers: 890, following: 234, posts: 45, avatar: '' },
        { id: '3', username: 'GymBro Max', bio: 'Lifting heavy 🏋️', followers: 567, following: 123, posts: 78, avatar: '' },
        { id: '4', username: 'Yoga Life', bio: 'Mind & Body', followers: 1200, following: 400, posts: 156, avatar: '' },
        { id: '5', username: 'Nutrition Pro', bio: 'Meal prep coach', followers: 3400, following: 89, posts: 234, avatar: '' },
        { id: '6', username: 'Runner Jane', bio: 'Marathon trainer', followers: 2100, following: 312, posts: 67, avatar: '' },
        { id: '7', username: 'CrossFit King', bio: 'WOD everyday', followers: 1800, following: 201, posts: 123, avatar: '' },
        { id: '8', username: 'Powerlifter', bio: 'Squat 500+ lbs', followers: 4500, following: 45, posts: 345, avatar: '' },
      ]);
    } else {
      setAllUsers(saved);
    }
    
    // Load following list
    setFollowing(JSON.parse(localStorage.getItem('kinetic_following') || []));
    
    // Load recent searches
    setRecentSearches(JSON.parse('kinetic_recent_searches') || []);
  }, []);

  // Fuzzy search algorithm
  const fuzzySearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    const q = searchQuery.toLowerCase();
    const matches = allUsers.filter(user => {
      const username = user.username.toLowerCase();
      return username.includes(q) || username.startsWith(q);
    });
    
    // If no direct match, find fuzzy matches
    if (matches.length === 0) {
      const fuzzyMatches = allUsers.filter(user => {
        const username = user.username.toLowerCase();
        // Check similarity (edit distance approximation)
        let count = 0;
        for (let i = 0; i < Math.min(username.length, q.length); i++) {
          if (username[i] === q[i]) count++;
        }
        const similarity = count / Math.max(username.length, q.length);
        return similarity > 0.4; // 40% similarity threshold
      });
      setResults(fuzzyMatches);
    } else {
      setResults(matches);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    fuzzySearch(value);
  };

  const selectUser = (user) => {
    // Add to recent searches
    const updated = [user.username, ...recentSearches.filter(r => r !== user.username)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('kinetic_recent_searches', JSON.stringify(updated));
    
    // Show profile preview
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

  const messageUser = (user) => {
    navigate('/messages');
  };

  const getAvatar = (user) => {
    return user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  };

  const isFollowing = (userId) => following.includes(userId);

  return (
    <main className="pt-28 pb-32 max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">Search</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Find Users</p>
      </header>

      {/* Search Input */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-500">search</span>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search users..."
            className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 focus:border-lime-400 outline-none transition-colors"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="p-4 border-b border-white/5">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Recent</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((username, i) => (
              <button
                key={i}
                onClick={() => { setQuery(username); fuzzySearch(username); }}
                className="bg-zinc-900/50 text-zinc-400 px-4 py-2 rounded-full text-sm border border-white/5 hover:border-lime-400/30"
              >
                {username}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results - Suggestions */}
      {query && results.length === 0 && (
        <div className="p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-zinc-600 mb-4">person_search</span>
          <p className="text-white font-bold">No users found</p>
          <p className="text-zinc-500 text-sm mt-2">Try searching for "coach", "gym", "fit"</p>
        </div>
      )}

      {/* Search Results */}
      <div className="divide-y divide-white/5">
        {results.map(user => (
          <div key={user.id} className="p-4 hover:bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <img src={getAvatar(user)} className="w-12 h-12 rounded-full bg-zinc-800" alt={user.username} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate">{user.username}</span>
                  {user.id === currentUser?.id && (
                    <span className="text-[10px] bg-lime-400 text-black px-2 py-0.5 rounded-full">You</span>
                  )}
                </div>
                <p className="text-zinc-500 text-sm truncate">{user.bio}</p>
              </div>
              <button onClick={() => selectUser(user)} className="p-3 text-zinc-400 hover:text-white">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* All Users Quick Access */}
      {!query && recentSearches.length === 0 && (
        <div className="p-4">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Suggested</h3>
          <div className="grid grid-cols-2 gap-3">
            {allUsers.slice(0, 6).map(user => (
              <button key={user.id} onClick={() => selectUser(user)} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 text-left hover:border-lime-400/30 transition-colors">
                <img src={getAvatar(user)} className="w-10 h-10 rounded-full mb-2" alt={user.username} />
                <p className="font-bold text-white text-sm truncate">{user.username}</p>
                <p className="text-zinc-500 text-xs">{user.followers} followers</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile Preview Modal */}
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
                <div className="text-center">
                  <p className="text-xl font-black text-white">{showProfile.posts}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-white">{showProfile.followers}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-white">{showProfile.following}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Following</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => toggleFollow(showProfile.id)}
                  className={`flex-1 py-3 rounded-2xl font-black uppercase text-sm ${
                    isFollowing(showProfile.id) 
                      ? 'bg-zinc-800 text-white border border-white/10' 
                      : 'bg-lime-400 text-black'
                  }`}
                >
                  {isFollowing(showProfile.id) ? 'Following' : 'Follow'}
                </button>
                <button 
                  onClick={() => messageUser(showProfile)}
                  className="flex-1 py-3 rounded-2xl font-black uppercase text-sm bg-zinc-800 text-white border border-white/10"
                >
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}