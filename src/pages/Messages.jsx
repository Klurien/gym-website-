import React, { useState, useEffect } from 'react';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/messages?action=conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.other_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="pt-32 pb-32 px-edge-margin min-h-screen max-w-2xl mx-auto">
      {/* Hero Section */}
      <section className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-white mb-1">MESSAGES</h2>
        <p className="font-label-sm text-label-sm text-zinc-500 tracking-widest uppercase">Direct line to performance</p>
      </section>

      {/* Search/Filter Bar */}
      <div className="mb-stack-lg relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-zinc-500 text-sm">search</span>
        </div>
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20 transition-all font-body-md placeholder:text-zinc-600" 
          placeholder="Search trainers or keywords..." 
          type="text"
        />
      </div>

      {/* Conversations List */}
      <div className="grid gap-gutter">
        {loading ? (
           <div className="flex justify-center py-10">
              <span className="material-symbols-outlined animate-spin text-lime-400 text-3xl">refresh</span>
           </div>
        ) : filteredConversations.length === 0 ? (
           <div className="bg-zinc-900/30 rounded-2xl p-6 text-center border border-white/5">
             <p className="text-zinc-500 font-label-bold uppercase tracking-widest text-[10px]">No Conversations Found</p>
           </div>
        ) : (
          filteredConversations.map(conv => (
            <div key={conv.other_id} className="group relative bg-zinc-900/30 backdrop-blur-md rounded-2xl p-container-padding border border-white/5 shadow-xl hover:border-lime-400/30 transition-all duration-300 active:scale-[0.98] cursor-pointer">
              <div className="flex gap-4">
                <div className="relative flex-shrink-0">
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden border border-white/10 ${conv.unread === 0 && 'grayscale-[30%]'}`}>
                    <img 
                      alt={conv.other_name} 
                      className="w-full h-full object-cover" 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_name}`}
                    />
                  </div>
                  {conv.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-lime-400 rounded-full border-4 border-zinc-900 shadow-[0_0_10px_rgba(204,255,0,0.5)] flex items-center justify-center">
                    </div>
                  )}
                  {conv.other_role === 'admin' && (
                    <div className="absolute -bottom-1 -right-1 bg-zinc-950 text-lime-400 px-1 rounded border border-white/10 text-[8px] font-black italic tracking-tighter">PRO</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-headline-md text-body-md font-bold transition-colors ${conv.unread > 0 ? 'text-white' : 'text-zinc-300'} group-hover:text-lime-400`}>
                      {conv.other_name}
                    </h3>
                    <span className={`font-label-sm text-[10px] uppercase tracking-tighter ${conv.unread > 0 ? 'text-lime-400' : 'text-zinc-500'}`}>
                      {new Date(conv.last_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`font-body-md text-sm line-clamp-1 ${conv.unread > 0 ? 'text-zinc-300 font-medium' : 'text-zinc-500'}`}>
                    {conv.last_message || 'Start chatting...'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Action / New Message */}
      <div className="mt-stack-lg">
        <button className="w-full flex items-center justify-center gap-3 bg-zinc-950 border border-white/10 text-zinc-300 py-6 rounded-2xl active:scale-95 transition-all hover:bg-zinc-900">
          <span className="material-symbols-outlined text-lime-400">add_comment</span>
          <span className="font-label-bold text-label-bold uppercase tracking-widest">Start New Conversation</span>
        </button>
      </div>
    </main>
  );
}
