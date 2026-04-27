/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, MessageSquare, Calendar, Zap, Menu, Bell, MoreVertical, Plus, Heart, Share2, Bookmark, Search, Play, Send, ChevronLeft, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { cn } from './lib/utils';
import { socket, connectSocket, disconnectSocket } from './services/socket';
import { User, MessageUpdate } from './types';
import Auth from './components/Auth';

// --- Types ---

type Screen = 'feed' | 'messages' | 'schedule' | 'alerts';

interface Post {
  id: string;
  author: {
    name: string;
    tier: string;
    avatar: string;
  };
  time: string;
  image: string;
  content: string;
  likes: string;
  comments: number;
  tag?: string;
  isVideo?: boolean;
  is_liked?: boolean;
  likes_count?: number;
  comments_count?: number;
}

interface Message {
  id: string;
  trainer: {
    name: string;
    avatar: string;
    online: boolean;
    tier?: string;
  };
  lastMessage: string;
  time: string;
  tags?: string[];
  unread?: boolean;
}

// --- Helpers ---
const getAuthToken = () => localStorage.getItem('token');

async function fetchPosts(): Promise<Post[]> {
  const token = getAuthToken();
  if (!token) return POSTS;
  try {
    const res = await fetch('/api/posts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return POSTS;
    const data = await res.json();
    return data.map((p: any) => ({
      id: p.id,
      author: {
        name: p.trainer_name || 'Trainer',
        tier: 'Pro Coach',
        avatar: p.trainer?.profile_pic || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=200&h=200&auto=format&fit=crop'
      },
      time: new Date(p.created_at).toLocaleDateString(),
      image: p.media_url || '',
      content: p.description || p.title,
      likes: String(p.likes_count || 0),
      comments: p.comments_count || 0,
      tag: p.type === 'video' ? 'VIDEO' : undefined,
      isVideo: p.type === 'video',
      is_liked: !!p.is_liked,
      likes_count: p.likes_count,
      comments_count: p.comments_count
    }));
  } catch {
    return POSTS;
  }
}

async function toggleLike(postId: string) {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch('/api/posts_social?action=like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ post_id: postId })
    });
  } catch { /* ignore */ }
}

// --- Mock Data ---

const POSTS: Post[] = [
  {
    id: '1',
    author: {
      name: 'Alex Rivers',
      tier: 'Elite Tier',
      avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&auto=format&fit=crop',
    },
    time: '2h ago',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
    content: "Crushing the morning leg session. Remember: velocity comes from the core. Stay focused on the kinetic chain. ⚡️ #LegDay #KineticPower",
    likes: '2.4k',
    comments: 128,
    tag: 'POWER MOVE'
  },
  {
    id: '2',
    author: {
      name: 'Sarah Kovac',
      tier: 'Pro Coach',
      avatar: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=200&h=200&auto=format&fit=crop',
    },
    time: '5h ago',
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop',
    content: "New mobility flow released on the dashboard. Perfect for recovery days. Check the Schedule tab for the live follow-along.",
    likes: '856',
    comments: 42,
    isVideo: true
  }
];

const MESSAGES: Message[] = [
  {
    id: '1',
    trainer: {
      name: 'Marcus Vane',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
      online: true,
    },
    lastMessage: "Your macro adjustments are live in the dashboard. Let's crush those sets today.",
    time: 'JUST NOW',
    tags: ['TRAINING PLAN', 'NUTRITION'],
    unread: true
  },
  {
    id: '2',
    trainer: {
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop',
      online: false,
    },
    lastMessage: "The recovery session was great! Don't forget the foam rolling tonight.",
    time: '14:20 PM',
  },
  {
    id: '3',
    trainer: {
      name: 'Damon Thorne',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop',
      online: false,
      tier: 'ELITE'
    },
    lastMessage: "Heavy leg day scheduled for Monday. Be ready at 0600 sharp.",
    time: 'YESTERDAY',
  },
  {
    id: '4',
    trainer: {
      name: 'Coach Leo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop',
      online: false,
    },
    lastMessage: "Awesome form on that deadlift clip you sent. Keep that spine neutral!",
    time: 'OCT 12',
  }
];

// --- Components ---

const TopBar = () => (
  <header className="fixed top-0 left-0 right-0 z-50 mt-4 mx-5 px-4 h-16 kinetic-glass rounded-2xl flex justify-between items-center kinetic-gradient-glow border border-white/10">
    <div className="flex items-center gap-4">
      <button className="p-2 text-zinc-400 hover:text-kinetic-lime transition-colors">
        <Menu size={24} />
      </button>
      <h1 className="text-xl font-black text-kinetic-lime tracking-tighter uppercase font-lexend">KINETIC</h1>
    </div>
    <div className="flex items-center gap-3">
      <button className="p-2 text-zinc-400 hover:text-kinetic-lime transition-colors relative">
        <Bell size={22} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-kinetic-lime rounded-full"></span>
      </button>
      <div className="w-10 h-10 rounded-full border-2 border-kinetic-lime p-0.5 overflow-hidden active:scale-95 transition-transform cursor-pointer">
        <img 
          src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&h=100&auto=format&fit=crop" 
          alt="Profile" 
          className="w-full h-full object-cover rounded-full shadow-lg"
        />
      </div>
    </div>
  </header>
);

const FeedScreen = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-6 pt-24 pb-32"
  >
    {/* Story / Bento Section */}
    <div className="grid grid-cols-4 gap-4 h-28 px-edge-margin">
      <div className="col-span-1 bg-zinc-900/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 hover:border-kinetic-lime/30 transition-all cursor-pointer group">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center group-hover:border-kinetic-lime">
          <Plus size={24} className="text-zinc-500 group-hover:text-kinetic-lime" />
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-kinetic-lime">Post</span>
      </div>
      <div className="col-span-3 bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden relative group cursor-pointer">
        <img 
          src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=600&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" 
          alt="Gym background" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        <div className="absolute bottom-3 left-4">
          <p className="text-xs font-black text-kinetic-lime uppercase tracking-widest">Live Workout</p>
          <p className="text-sm font-medium text-white">Join Alex in 5 mins</p>
        </div>
      </div>
    </div>

    {/* Post Feed */}
    <div className="space-y-6 px-edge-margin">
      {POSTS.map(post => (
        <article key={post.id} className="bg-zinc-900/60 rounded-[28px] border border-white/5 overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full border border-kinetic-lime" />
              <div>
                <h3 className="text-sm font-bold text-white">{post.author.name}</h3>
                <p className="text-[10px] font-medium text-zinc-500">{post.author.tier} • {post.time}</p>
              </div>
            </div>
            <button className="text-zinc-500 hover:text-white">
              <MoreVertical size={20} />
            </button>
          </div>
          
          <div className="px-4 pb-2 relative group">
            <div className="aspect-[4/5] rounded-[24px] overflow-hidden relative">
              <img src={post.image} className={`w-full h-full object-cover ${post.isVideo ? 'brightness-75' : ''}`} alt="Post content" />
              {post.tag && (
                <div className="absolute top-4 right-4 bg-kinetic-lime text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(195,244,0,0.4)]">
                  {post.tag}
                </div>
              )}
              {post.isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full kinetic-glass flex items-center justify-center border-kinetic-lime/50 group-hover:scale-110 transition-transform cursor-pointer">
                    <Play size={32} className="text-kinetic-lime fill-current ml-1" />
                  </div>
                </div>
              )}
            </div>
            {post.isVideo && (
              <div className="mt-3 mx-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-kinetic-lime shadow-[0_0_10px_rgba(195,244,0,0.6)]"></div>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-zinc-300 leading-relaxed font-normal">
              {post.content}
            </p>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-kinetic-lime group">
                  <Heart size={20} className="group-active:scale-125 transition-transform fill-current" />
                  <span className="text-xs font-bold">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300">
                  <MessageSquare size={20} />
                  <span className="text-xs font-bold">{post.comments}</span>
                </button>
                <button className="text-zinc-500 hover:text-zinc-300">
                  <Share2 size={20} />
                </button>
              </div>
              <button className="text-zinc-500 hover:text-zinc-300">
                <Bookmark size={20} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  </motion.div>
);

const TrainerDashboard = ({ user }: { user: User }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="px-edge-margin pt-24 pb-32 space-y-8"
  >
    <header>
      <h2 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase">Command Center</h2>
      <p className="text-[10px] font-bold text-kinetic-lime tracking-[0.2em] uppercase">Overseeing 12 active protocols</p>
    </header>

    {/* Client Grid */}
    <div className="grid grid-cols-2 gap-4">
      <div className="p-5 kinetic-glass rounded-[28px] border-white/5 space-y-3">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded-full bg-kinetic-lime/10 flex items-center justify-center text-kinetic-lime">
            <UserIcon size={20} />
          </div>
          <span className="text-[9px] font-black text-kinetic-lime bg-kinetic-lime/10 px-2 py-1 rounded-full">+12%</span>
        </div>
        <div>
          <p className="text-2xl font-black text-white">48</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Active Clients</p>
        </div>
      </div>
      <div className="p-5 kinetic-glass rounded-[28px] border-white/5 space-y-3">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Calendar size={20} />
          </div>
          <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">LIVE</span>
        </div>
        <div>
          <p className="text-2xl font-black text-white">08</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Sessions Today</p>
        </div>
      </div>
    </div>

    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Priority Clients</h3>
        <button className="text-[9px] font-bold text-kinetic-lime uppercase tracking-widest">View All</button>
      </div>
      <div className="space-y-3">
        {[
          { name: 'Jake Miller', goal: 'Hypertrophy Phase 2', progress: 75, status: 'On Track' },
          { name: 'Elena Rossi', goal: 'Mobility Reset', progress: 30, status: 'Needs Update' }
        ].map((client, i) => (
          <div key={i} className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
              <span className="text-sm font-black text-zinc-500">{client.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{client.name}</h4>
              <p className="text-[10px] font-medium text-zinc-500">{client.goal}</p>
            </div>
            <div className="text-right">
              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", client.status === 'On Track' ? 'text-kinetic-lime' : 'text-orange-500')}>
                {client.status}
              </p>
              <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full", client.status === 'On Track' ? 'bg-kinetic-lime' : 'bg-orange-500')} 
                  style={{ width: `${client.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="p-6 rounded-[32px] bg-kinetic-lime text-black space-y-4 shadow-[0_0_30px_rgba(195,244,0,0.3)]">
      <div>
        <h3 className="text-lg font-black tracking-tighter uppercase leading-tight">Broadcast Protocol</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Send update to all active clients</p>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-3 bg-black text-kinetic-lime rounded-xl text-[10px] font-black tracking-widest uppercase hover:opacity-90 transition-opacity">
          Video Protocol
        </button>
        <button className="flex-1 py-3 bg-black/10 border border-black/20 text-black rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-black/20 transition-all">
          Text Update
        </button>
      </div>
    </section>
  </motion.div>
);

const MessagesScreen = ({ user, onOpenChat }: { user: User, onOpenChat: (trainer: any) => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="px-edge-margin pt-24 pb-32"
  >
    <header className="mb-8">
      <h2 className="text-4xl font-black text-white mb-1 tracking-tighter">MESSAGES</h2>
      <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">Direct line to performance</p>
    </header>

    <div className="relative mb-8">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
      <input 
        type="text" 
        placeholder="Search trainers or keywords..." 
        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-kinetic-lime/30 focus:ring-4 focus:ring-kinetic-lime/5 transition-all"
      />
    </div>

    <div className="space-y-4">
      {MESSAGES.map(msg => (
        <div 
          key={msg.id} 
          onClick={() => onOpenChat(msg.trainer)}
          className={`p-4 rounded-[28px] border border-white/5 flex flex-col gap-4 transition-all hover:border-kinetic-lime/30 cursor-pointer active:scale-[0.98] ${msg.unread ? 'bg-zinc-900' : 'bg-zinc-900/40'}`}
        >
          <div className="flex gap-4">
            <div className="relative flex-shrink-0">
              <img src={msg.trainer.avatar} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt={msg.trainer.name} />
              {msg.trainer.online && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-kinetic-lime rounded-full border-4 border-zinc-900 shadow-[0_0_10px_rgba(195,244,0,1)]"></div>
              )}
              {msg.trainer.tier && (
                <div className="absolute -bottom-1 -right-1 bg-zinc-950 text-kinetic-lime px-1 rounded border border-white/10 text-[8px] font-black italic tracking-tighter">
                  {msg.trainer.tier}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-base font-bold text-white truncate">{msg.trainer.name}</h3>
                <span className={`text-[10px] font-black uppercase tracking-tighter ${msg.unread ? 'text-kinetic-lime' : 'text-zinc-600'}`}>
                  {msg.time}
                </span>
              </div>
              <p className={`text-sm line-clamp-1 ${msg.unread ? 'text-zinc-200' : 'text-zinc-500'}`}>
                {msg.lastMessage}
              </p>
            </div>
          </div>
          {msg.tags && (
            <div className="flex gap-2 pl-1">
              {msg.tags.map(tag => (
                <span key={tag} className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${tag === 'TRAINING PLAN' ? 'bg-kinetic-lime/10 text-kinetic-lime border border-kinetic-lime/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>

    <button className="w-full mt-10 p-5 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center gap-3 group hover:bg-zinc-900 transition-colors">
      <MessageSquare size={20} className="text-kinetic-lime" />
      <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Start New Conversation</span>
    </button>
  </motion.div>
);

const ChatRoom = ({ user, recipient, onBack }: { user: User, recipient: any, onBack: () => void }) => {
  const [messages, setMessages] = useState<MessageUpdate[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('receive_message', (data: MessageUpdate) => {
      setMessages(prev => [...prev, data]);
    });
    return () => { socket.off('receive_message'); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msg: MessageUpdate = {
      userId: user.id,
      userName: user.name,
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('send_message', msg);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-kinetic-bg flex flex-col">
      <header className="h-20 kinetic-glass border-b border-white/5 flex items-center px-6 gap-4">
        <button onClick={onBack} className="p-2 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="relative">
          <img src={recipient.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={recipient.name} />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-kinetic-lime rounded-full border-2 border-zinc-900"></div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{recipient.name}</h3>
          <p className="text-[9px] font-black text-kinetic-lime tracking-widest uppercase">Protocol Active</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="text-center py-8">
          <p className="text-[10px] font-black text-zinc-700 tracking-[0.3em] uppercase">Security Encrypted Session Established</p>
        </div>
        
        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col max-w-[85%]", m.userId === user.id ? "ml-auto items-end" : "mr-auto items-start")}>
             <div className={cn(
               "p-4 rounded-[20px] text-sm leading-relaxed",
               m.userId === user.id 
                ? "bg-kinetic-lime text-black rounded-tr-none shadow-[0_0_20px_rgba(195,244,0,0.2)]" 
                : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5"
             )}>
               {m.text}
             </div>
             <span className="text-[9px] font-bold text-zinc-600 mt-2 uppercase tracking-tighter">{m.timestamp}</span>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-6 bg-zinc-900/50 border-t border-white/5 flex gap-3 items-center">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="SEND COMMAND..."
          className="flex-1 bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-medium text-white focus:outline-none focus:border-kinetic-lime/30 transition-all placeholder:text-zinc-700"
        />
        <button type="submit" className="w-12 h-12 bg-kinetic-lime text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(195,244,0,0.3)] hover:scale-105 active:scale-95 transition-all">
          <Send size={20} fill="black" />
        </button>
      </form>
    </div>
  );
};

const NavBar = ({ current, setScreen }: { current: Screen, setScreen: (s: Screen) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 mb-8 mx-8 h-20 kinetic-glass rounded-full border border-white/5 flex items-center justify-around px-6 shadow-[0px_20px_50px_rgba(0,0,0,0.5)]">
    <button 
      onClick={() => setScreen('feed')}
      className={`p-3 rounded-full transition-all duration-300 relative ${current === 'feed' ? 'bg-kinetic-lime text-black shadow-[0_0_20px_rgba(195,244,0,0.6)]' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      <Home size={24} fill={current === 'feed' ? 'black' : 'none'} />
    </button>
    <button 
      onClick={() => setScreen('messages')}
      className={`p-3 rounded-full transition-all duration-300 relative ${current === 'messages' ? 'bg-kinetic-lime text-black shadow-[0_0_20px_rgba(195,244,0,0.6)]' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      <MessageSquare size={24} fill={current === 'messages' ? 'black' : 'none'} />
      {MESSAGES.some(m => m.unread) && current !== 'messages' && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-kinetic-lime rounded-full border border-zinc-900"></span>
      )}
    </button>
    <button 
      onClick={() => setScreen('schedule')}
      className={`p-3 rounded-full transition-all duration-300 relative ${current === 'schedule' ? 'bg-kinetic-lime text-black shadow-[0_0_20px_rgba(195,244,0,0.6)]' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      <Calendar size={24} fill={current === 'schedule' ? 'black' : 'none'} />
    </button>
    <button 
      onClick={() => setScreen('alerts')}
      className={`p-3 rounded-full transition-all duration-300 relative ${current === 'alerts' ? 'bg-kinetic-lime text-black shadow-[0_0_20px_rgba(195,244,0,0.6)]' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      <Zap size={24} fill={current === 'alerts' ? 'black' : 'none'} />
    </button>
  </nav>
);

const CreatePostModal = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setMediaUrl(data.url);
        setUploaded(true);
      } else {
        alert('Upload failed. Try a URL instead.');
      }
    } catch { alert('Upload error.'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const type = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'static';
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, description, media_url: mediaUrl, tags, type })
      });
      if (res.ok) { onClose(); }
      else { alert('Only admins can post.'); }
    } catch { alert('Failed to post.'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-zinc-950 border border-white/10 rounded-[40px] p-8 w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,1)] ring-1 ring-white/5 z-10"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">Create Elite Post</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-kinetic-lime animate-pulse" />
              <span className="text-[10px] font-black text-kinetic-lime uppercase tracking-[0.2em]">Global Broadcast</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
          >
            <span className="material-symbols-outlined text-zinc-500 group-hover:text-white transition-colors" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Campaign Title</label>
            <input
              required
              type="text"
              placeholder="e.g. MORNING GRIND"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 text-white rounded-2xl py-4 px-6 focus:border-kinetic-lime/50 focus:ring-4 focus:ring-kinetic-lime/5 outline-none font-bold placeholder:text-zinc-700 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Elite Description</label>
            <textarea
              required
              placeholder="Forge your legacy..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full h-28 bg-zinc-900/50 border border-white/5 text-white rounded-2xl py-4 px-6 focus:border-kinetic-lime/50 focus:ring-4 focus:ring-kinetic-lime/5 resize-none outline-none font-medium placeholder:text-zinc-700 transition-all"
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Media Asset</label>
            <label
              htmlFor="elite-media-upload"
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[28px] p-8 cursor-pointer transition-all group ${
                uploaded ? 'border-kinetic-lime bg-kinetic-lime/5' : 'border-white/5 bg-zinc-900/30 hover:border-white/20'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 border-4 border-kinetic-lime/20 border-t-kinetic-lime rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Uploading...</span>
                </div>
              ) : uploaded ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-kinetic-lime rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(195,244,0,0.3)]">
                    <span className="material-symbols-outlined text-black text-2xl font-bold">check</span>
                  </div>
                  <span className="text-[10px] font-black text-kinetic-lime uppercase tracking-[0.2em]">Asset Secured</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/5 group-hover:bg-kinetic-lime transition-all duration-500">
                    <span className="material-symbols-outlined text-3xl text-zinc-500 group-hover:text-black transition-colors">upload_file</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-black text-white uppercase tracking-widest">Select Elite Media</span>
                    <span className="block text-[9px] text-zinc-500 uppercase tracking-[0.1em] mt-1">Video (mp4) or Image (jpg/png)</span>
                  </div>
                </div>
              )}
              <input id="elite-media-upload" type="file" onChange={handleFile} className="hidden" accept="image/*,video/*" />
            </label>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">or URL</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-600 text-lg group-focus-within:text-kinetic-lime transition-colors">link</span>
              <input
                type="text"
                placeholder="https://..."
                value={mediaUrl}
                onChange={e => { setMediaUrl(e.target.value); setUploaded(false); }}
                className="w-full bg-zinc-900/50 border border-white/5 text-white rounded-2xl py-4 pl-14 pr-6 focus:border-kinetic-lime/50 outline-none text-[11px] font-bold transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tags</label>
            <input
              type="text"
              placeholder="e.g. legday, strength"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 text-white rounded-2xl py-4 px-6 focus:border-kinetic-lime/50 outline-none text-sm font-medium transition-all placeholder:text-zinc-700"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest py-5 rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={uploading || !title}
              className="flex-1 bg-kinetic-lime text-black font-black text-[10px] uppercase tracking-widest py-5 rounded-2xl shadow-[0_20px_40px_rgba(195,244,0,0.15)] hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              Publish Post
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const FAB = ({ screen, onPress }: { screen: Screen, onPress: () => void }) => (
  <AnimatePresence>
    {screen === 'feed' && (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        onClick={onPress}
        className="fixed bottom-32 right-8 w-14 h-14 bg-kinetic-lime text-black rounded-2xl shadow-[0_0_30px_rgba(195,244,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus size={32} strokeWidth={3} />
      </motion.button>
    )}
  </AnimatePresence>
);

export default function KineticApp() {
  const [screen, setScreen] = useState<Screen>('feed');
  const [user, setUser] = useState<User | null>(null);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    if (user) {
      connectSocket(user.id);
    } else {
      disconnectSocket();
    }
  }, [user]);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-kinetic-bg overflow-x-hidden selection:bg-kinetic-lime selection:text-black">
      <TopBar />
      
      <main className="max-w-xl mx-auto min-h-screen">
        <AnimatePresence mode="wait">
          {screen === 'feed' && <FeedScreen key="feed" />}
          {screen === 'messages' && <MessagesScreen key="messages" user={user} onOpenChat={setActiveChat} />}
          {screen === 'schedule' && user.role === 'trainer' && <TrainerDashboard key="trainer" user={user} />}
          {(screen === 'schedule' && user.role !== 'trainer') || screen === 'alerts' && (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-screen pt-24 text-zinc-600"
            >
              <Zap size={64} className="mb-4 opacity-20" />
              <p className="text-sm font-black uppercase tracking-widest italic">{screen} coming soon</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <NavBar current={screen} setScreen={(s) => { setScreen(s); setActiveChat(null); }} />
      <FAB screen={screen} onPress={() => setShowPostModal(true)} />
      <AnimatePresence>
        {showPostModal && <CreatePostModal onClose={() => setShowPostModal(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {activeChat && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70]"
          >
            <ChatRoom user={user} recipient={activeChat} onBack={() => setActiveChat(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
