import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';

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
  const [incomingCall, setIncomingCall] = useState(null); 
  const chatEndRef = useRef(null);

  const navigate = useNavigate();
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

  useEffect(() => {
    // Socket Typing Listeners
    socket.on('typing_status', ({ userId, isTyping }) => {
      if (activeChat && activeChat.id === userId) {
        setIsOtherTyping(isTyping);
      }
    });

    socket.on('message_status_update', ({ message_id, sender_id, status }) => {
      setMessages(prev => prev.map(m => {
        if (message_id && m.id === message_id) {
          return { ...m, is_delivered: status === 'delivered' || m.is_delivered, is_read: status === 'seen' || m.is_read };
        }
        if (sender_id && String(m.receiver_id) === String(sender_id)) {
           return { ...m, is_read: status === 'seen' || m.is_read };
        }
        return m;
      }));
    });

    socket.on('new_message_ping', ({ sender_id, message_id }) => {
      if (activeChat && String(activeChat.id) === String(sender_id)) {
        fetchThread(activeChat.id, true);
        socket.emit('message_seen', { sender_id: activeChat.id });
      } else {
        socket.emit('message_delivered', { message_id, sender_id });
      }
    });

    socket.on('incoming_call', ({ fromUserId, fromUserName, roomName }) => {
      setIncomingCall({ fromUserId, fromUserName, roomName });
    });

    socket.on('call_cancelled', () => {
      setIncomingCall(null);
    });

    socket.on('call_rejected', () => {
      alert("Recipient is currently busy or declined the call.");
    });

    return () => {
      socket.off('typing_status');
      socket.off('message_status_update');
      socket.off('new_message_ping');
      socket.off('incoming_call');
      socket.off('call_cancelled');
      socket.off('call_rejected');
    };
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
        if (!isPolling && data.messages?.length > 0) {
           socket.emit('message_seen', { sender_id: userId });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isPolling) setLoadingChat(false);
    }
  };

  const handleInputChange = (e) => {
    setTextInput(e.target.value);
    if (activeChat) {
      socket.emit('typing', { receiver_id: activeChat.id });
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => {
        socket.emit('stop_typing', { receiver_id: activeChat.id });
      }, 1500));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || !activeChat) return;
    
    // Stop typing on send
    socket.emit('stop_typing', { receiver_id: activeChat.id });
    if (typingTimeout) clearTimeout(typingTimeout);

    const content = textInput;
    setTextInput('');
    
    // Optimistic UI
    setMessages(prev => [...prev, { id: Date.now(), sender_id: currentUserId, receiver_id: activeChat.id, content, created_at: new Date().toISOString() }]);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: activeChat.id, content })
      });
      if (res.ok) {
        const data = await res.json();
        socket.emit('send_message_ping', { receiver_id: activeChat.id, message_id: data.id });
      }
      fetchThread(activeChat.id, true);
    } catch (err) {
      console.error('Message send failed');
    }
  };

  const getRoomName = (id1, id2) => {
    const sorted = [String(id1), String(id2)].sort();
    return `KineticElite_Room_${sorted[0]}_${sorted[1]}`;
  };

  const startCall = () => {
    if (!activeChat) return;
    const roomName = getRoomName(currentUserId, activeChat.id);
    const callerName = JSON.parse(localStorage.getItem('user') || '{}')?.username || 'Member';
    
    socket.emit('initiate_call', { receiver_id: activeChat.id, roomName, callerName });
    alert("Requesting Elite Call connection...");
    window.open(`https://meet.jit.si/${roomName}`, '_blank');
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
              onClick={startCall}
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
                    <div className="flex items-center justify-between gap-4 mt-2">
                      <span className={`block text-[9px] font-bold uppercase tracking-widest ${isMine ? 'text-black/50' : 'text-zinc-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && (
                        <div className="flex items-center">
                          {msg.is_read ? (
                            <span className="material-symbols-outlined text-[14px] text-lime-900 font-bold">done_all</span>
                          ) : msg.is_delivered ? (
                            <span className="material-symbols-outlined text-[14px] text-black/40">done_all</span>
                          ) : (
                            <span className="material-symbols-outlined text-[14px] text-black/40">done</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isOtherTyping && (
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-zinc-800 p-4 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0.4s' }}></div>
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
        
        {incomingCall && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500"></div>
            <div className="relative w-full max-w-sm bg-zinc-900 border border-white/5 rounded-[40px] p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-lime-400 p-2 mb-8 relative">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.fromUserName}`} className="w-full h-full rounded-full" alt="Caller" />
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-lime-400 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">LIVE</div>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{incomingCall.fromUserName}</h2>
              <p className="text-[10px] font-bold text-lime-400 uppercase tracking-[0.3em] mb-10 animate-pulse">Incoming Elite Protocol...</p>
              
              <div className="w-full flex gap-4">
                <button 
                  onClick={() => {
                    socket.emit('reject_call', { caller_id: incomingCall.fromUserId });
                    setIncomingCall(null);
                  }}
                  className="flex-1 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group"
                >
                  <span className="material-symbols-outlined font-black group-active:scale-75 transition-transform">call_end</span>
                </button>
                <button 
                  onClick={() => {
                    window.open(`https://meet.jit.si/${incomingCall.roomName}`, '_blank');
                    setIncomingCall(null);
                  }}
                  className="flex-1 h-16 bg-lime-400 text-black rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(204,255,0,0.4)] hover:bg-lime-300 transition-all group"
                >
                  <span className="material-symbols-outlined font-black group-active:scale-125 transition-transform">call</span>
                </button>
              </div>
            </div>
          </div>
        )}
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
