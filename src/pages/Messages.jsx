import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Single Chat View State
  const [activeChat, setActiveChat] = useState(null); // stores { id, username, role }
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const chatEndRef = useRef(null);

  const navigate = useNavigate();
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

  useEffect(() => {
    // Socket Typing Listeners
    if (window.socket) {
      window.socket.on('typing_status', ({ userId, isTyping }) => {
        if (activeChat && activeChat.id === userId) {
          setIsOtherTyping(isTyping);
        }
      });
      return () => {
        window.socket.off('typing_status');
      };
    }
  }, [activeChat]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      if (!activeChat) {
        fetchConversations();
      } else {
        fetchThread(activeChat.id);
        const interval = setInterval(() => fetchThread(activeChat.id, true), 3000);
        return () => clearInterval(interval);
      }
    } else {
      // Client mode: direct to trainer (assume ID 1 or the first trainer)
      // For now, we'll fetch the conversations and pick the first one, or use a default
      if (!activeChat) {
        fetchDirectTrainer();
      } else {
        fetchThread(activeChat.id);
        const interval = setInterval(() => fetchThread(activeChat.id, true), 3000);
        return () => clearInterval(interval);
      }
    }
  }, [activeChat]);

  const fetchDirectTrainer = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/auth');
    try {
      const res = await fetch('/api/messages?action=conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const trainer = data.conversations?.[0] || data.availableTrainers?.[0];
        if (trainer) {
          // If it's from availableTrainers, it might have id instead of other_id
          const trainerId = trainer.other_id || trainer.id;
          const trainerName = trainer.other_name || trainer.username;
          const trainerRole = trainer.other_role || trainer.role;
          setActiveChat({ id: trainerId, username: trainerName, role: trainerRole });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }
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

  const fetchThread = async (userId, isPolling = false) => {
    const token = localStorage.getItem('token');
    if (!isPolling) setLoadingChat(true);
    try {
      const res = await fetch(`/api/messages?with=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isPolling) setLoadingChat(false);
    }
  };

  const handleInputChange = (e) => {
    setTextInput(e.target.value);
    if (window.socket && activeChat) {
      window.socket.emit('typing', { receiver_id: activeChat.id });
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => {
        window.socket.emit('stop_typing', { receiver_id: activeChat.id });
      }, 1500));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || !activeChat) return;
    
    // Stop typing on send
    if (window.socket) window.socket.emit('stop_typing', { receiver_id: activeChat.id });
    if (typingTimeout) clearTimeout(typingTimeout);

    const content = textInput;
    setTextInput('');
    
    // Optimistic UI
    setMessages(prev => [...prev, { id: Date.now(), sender_id: currentUserId, receiver_id: activeChat.id, content, created_at: new Date().toISOString() }]);

    const token = localStorage.getItem('token');
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: activeChat.id, content })
      });
      fetchThread(activeChat.id, true);
    } catch (err) {
      console.error('Message send failed');
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.other_name.toLowerCase().includes(search.toLowerCase())
  );

  // If a chat is active, render the Chat interface
  if (activeChat) {
    return (
      <main className="h-screen w-full flex flex-col bg-background">
        <header className="px-4 h-24 pt-10 pb-4 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => {
               if (JSON.parse(localStorage.getItem('user') || '{}')?.role === 'admin') {
                 setActiveChat(null);
               } else {
                 navigate('/feed');
               }
            }} className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform">
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-lime-400/20">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.username}`} className="w-full h-full object-cover" alt="User" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  {activeChat.username}
                  {activeChat.role === 'admin' && <span className="bg-lime-400 text-black px-1.5 py-0.5 rounded-[4px] text-[8px] font-black">PRO</span>}
                </h3>
                <span className="text-lime-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 inline-block animate-pulse"></span> Active Now
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                alert("Initializing Elite Call via Jitsi Meet...");
                window.open(`https://meet.jit.si/KineticElite_${activeChat.id}_${JSON.parse(localStorage.getItem('user') || '{}')?.id}`, '_blank');
              }}
              className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-lime-400 hover:bg-lime-400 hover:text-black transition-all shadow-xl active:scale-90"
            >
              <span className="material-symbols-outlined font-bold">call</span>
            </button>
            <button className="text-zinc-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {loadingChat ? (
            <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-lime-400">refresh</span></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 uppercase tracking-widest text-xs font-bold gap-4">
              <span className="material-symbols-outlined text-4xl opacity-50">forum</span>
              Secure end-to-end connection established
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = String(msg.sender_id) === String(currentUserId);
              return (
                <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-3xl ${isMine ? 'bg-lime-400 text-black rounded-br-sm shadow-[0_5px_15px_rgba(204,255,0,0.2)]' : 'bg-zinc-800 text-white rounded-bl-sm border border-white/5'}`}>
                   <p className="font-body-md text-sm">{msg.content}</p>
                   <span className={`block text-[9px] mt-2 font-bold uppercase tracking-widest ${isMine ? 'text-black/50' : 'text-zinc-500'}`}>
                     {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                  </div>
                </div>
              );
            })
          )}
          {isOtherTyping && (
            <div className="flex items-center gap-2 px-2 py-4 animate-pulse">
              <div className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-4 py-2 rounded-2xl rounded-bl-none italic">
                {activeChat.username} is typing...
              </div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        <div className="fixed bottom-[104px] left-0 right-0 p-4 bg-zinc-950/20 backdrop-blur-md pb-4 z-[70]">
          <form onSubmit={sendMessage} className="flex gap-2 max-w-2xl mx-auto">
            <input 
              type="text" 
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Send a message..." 
              className="flex-1 bg-zinc-900/90 border border-white/10 text-white rounded-full py-4 px-6 focus:outline-none focus:border-lime-400 focus:bg-zinc-800 transition-all text-sm font-body-md shadow-2xl"
            />
            <button type="submit" disabled={!textInput.trim()} className="w-14 h-14 bg-lime-400 text-black rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-90 transition-transform shadow-[0_0_20px_rgba(204,255,0,0.4)]">
              <span className="material-symbols-outlined font-bold">send</span>
            </button>
          </form>
        </div>
      </main>
    );
  }

  // List View
  return (
    <main className="pt-32 pb-32 px-edge-margin min-h-screen max-w-2xl mx-auto">
      {/* Hero Section */}
      <section className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-white mb-1 uppercase text-shadow">Inbox</h2>
        <p className="font-label-sm text-label-sm text-zinc-500 tracking-widest uppercase drop-shadow-md">Direct line to performance</p>
      </section>

      {/* Search/Filter Bar */}
      <div className="mb-stack-lg relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-zinc-500 text-sm">search</span>
        </div>
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20 transition-all font-body-md shadow-xl" 
          placeholder="Search trainers or keywords..." 
          type="text"
        />
      </div>

      {/* Conversations List */}
      <div className="grid gap-gutter">
        {loading ? (
           <div className="flex justify-center py-10">
              <span className="material-symbols-outlined animate-spin text-lime-400 text-3xl drop-shadow-xl">refresh</span>
           </div>
        ) : filteredConversations.length === 0 ? (
           <div className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/5">
             <p className="text-zinc-500 font-label-bold uppercase tracking-widest text-[10px]">No Conversations Found</p>
           </div>
        ) : (
          filteredConversations.map(conv => (
            <div 
              key={conv.other_id} 
              onClick={() => setActiveChat({ id: conv.other_id, username: conv.other_name, role: conv.other_role })}
              className="group relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-container-padding border border-white/5 shadow-2xl hover:border-lime-400/30 transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
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
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-lime-400 rounded-full border-4 border-zinc-900 shadow-[0_0_15px_rgba(204,255,0,0.6)] flex items-center justify-center animate-pulse"></div>
                  )}
                  {conv.other_role === 'admin' && (
                    <div className="absolute -bottom-1 -right-1 bg-zinc-950 text-lime-400 px-1 rounded border border-white/10 text-[8px] font-black italic tracking-tighter">PRO</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-headline-md text-body-md font-bold transition-colors ${conv.unread > 0 ? 'text-lime-400' : 'text-zinc-300'} group-hover:text-lime-400`}>
                      {conv.other_name}
                    </h3>
                    <span className={`font-label-sm text-[10px] uppercase tracking-widest ${conv.unread > 0 ? 'text-lime-400 font-black' : 'text-zinc-500'}`}>
                      {new Date(conv.last_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`font-body-md text-sm line-clamp-1 ${conv.unread > 0 ? 'text-white font-medium drop-shadow-md' : 'text-zinc-500'}`}>
                    {conv.last_message || 'Start chatting...'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </main>
  );
}
