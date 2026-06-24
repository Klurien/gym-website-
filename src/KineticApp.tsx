import { useState, useEffect, useRef } from 'react';
import { Dumbbell, MessageSquare, User, Trophy, Crown, Lock, ChevronRight, Send, BarChart3, Users, LogOut, Menu, X, CheckCircle, Play, Target, Clock, Flame, Medal, ArrowLeft } from 'lucide-react';
import { cn } from './lib/utils';
import Auth from './components/Auth';

type Screen = 'dashboard' | 'programs' | 'messages' | 'profile';
type Level = 'beginner' | 'intermediate' | 'advanced';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'trainee' | 'trainer' | 'admin';
  profile_pic?: string;
  level?: Level;
  premium?: boolean;
}

interface Program {
  id: string;
  title: string;
  description: string;
  level: Level;
  duration: string;
  sessions: number;
  price: number;
  image: string;
  unlocked: boolean;
}

interface Trainee {
  id: string;
  username: string;
  email: string;
  profile_pic?: string;
  level: Level;
  premium: boolean;
  last_seen?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

const PROGRAMS: Program[] = [
  { id: '1', title: 'Foundation Strength', description: 'Build your core with compound movements. Perfect for first-timers.', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop', unlocked: true },
  { id: '2', title: 'Bodyweight Mastery', description: 'Master pushups, pullups, and bodyweight fundamentals.', level: 'beginner', duration: '6 weeks', sessions: 18, price: 0, image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop', unlocked: true },
  { id: '3', title: 'Hypertrophy Accelerator', description: 'Progressive overload for lean muscle growth.', level: 'intermediate', duration: '8 weeks', sessions: 24, price: 29, image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop', unlocked: false },
  { id: '4', title: 'Power & Explosiveness', description: 'Olympic lifts and plyometrics for athletic performance.', level: 'intermediate', duration: '6 weeks', sessions: 18, price: 39, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop', unlocked: false },
  { id: '5', title: 'Elite Performance', description: 'Advanced periodization for experienced lifters.', level: 'advanced', duration: '12 weeks', sessions: 36, price: 79, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop', unlocked: false },
  { id: '6', title: 'Certified Coach', description: 'Full coaching certification under expert mentorship.', level: 'advanced', duration: '16 weeks', sessions: 48, price: 149, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop', unlocked: false },
];

const COACH = {
  name: 'Coach Alex',
  title: 'Head Trainer',
  image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&auto=format&fit=crop',
  bio: '10+ years transforming athletes. Specializing in strength, mobility, and performance nutrition.',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

function TraineeDashboard({ user }: { user: User }) {
  const unlocked = PROGRAMS.filter(p => p.unlocked || user.premium || p.price === 0).length;
  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="t-display font-anton text-white">{greeting()}, {user.username}</h1>
        <p className="t-small mt-1" style={{ color: 'var(--text-2)' }}>Your journey with {COACH.name}</p>
      </header>

      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--red)] shrink-0">
          <img src={COACH.image} className="w-full h-full object-cover" alt={COACH.name} />
        </div>
        <div className="flex-1">
          <h3 className="t-h3 text-white">{COACH.name}</h3>
          <p className="t-small" style={{ color: 'var(--red)' }}>{COACH.title}</p>
          <p className="t-small mt-1" style={{ color: 'var(--text-2)' }}>{COACH.bio}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Your Level', value: (user.level || 'beginner').charAt(0).toUpperCase() + (user.level || 'beginner').slice(1), icon: Medal, color: 'var(--red)' },
          { label: 'Programs', value: `${unlocked}/${PROGRAMS.length}`, icon: Trophy, color: 'var(--amber)' },
        ].map((s, i) => (
          <div key={i} className="card flex flex-col gap-2">
            <s.icon size={20} style={{ color: s.color }} />
            <p className="t-h1" style={{ color: s.color }}>{s.value}</p>
            <p className="t-label" style={{ color: 'var(--text-2)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {!user.premium && (
        <div className="card relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--red-soft), transparent)', border: '1px solid var(--red)' }}>
          <div className="flex items-start gap-4">
            <Crown size={28} className="shrink-0" style={{ color: 'var(--amber)' }} />
            <div>
              <h3 className="t-h2 text-white mb-1">Unlock Full Potential</h3>
              <p className="t-small mb-4" style={{ color: 'var(--text-2)' }}>Get access to all intermediate & advanced programs.</p>
              <button className="btn">Upgrade — from $29</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainerDashboard({ user }: { user: User }) {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const filtered = data.filter((u: any) => u.role === 'trainee');
        setTrainees(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCount = trainees.filter(t => t.last_seen).length;

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="t-display font-anton text-white">{greeting()}, Coach</h1>
        <p className="t-small mt-1" style={{ color: 'var(--text-2)' }}>You have {trainees.length} trainees — {activeCount} active today</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Trainees', value: trainees.length, icon: Users, color: 'var(--red)' },
          { label: 'Active', value: activeCount, icon: BarChart3, color: 'var(--green)' },
          { label: 'Programs', value: PROGRAMS.length, icon: Dumbbell, color: 'var(--amber)' },
        ].map((s, i) => (
          <div key={i} className="card flex flex-col items-center text-center gap-1 py-5">
            <s.icon size={20} style={{ color: s.color }} />
            <p className="t-h1" style={{ color: s.color }}>{s.value}</p>
            <p className="t-label" style={{ color: 'var(--text-2)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="t-h2 text-white mb-4">All Trainees</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" /></div>
        ) : trainees.length === 0 ? (
          <div className="card text-center py-10">
            <Users size={32} style={{ color: 'var(--text-3)' }} className="mx-auto mb-3" />
            <p className="t-body" style={{ color: 'var(--text-2)' }}>No trainees yet. Share the gym code to invite them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainees.map(t => (
              <div key={t.id} className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--surface-2)] shrink-0 flex items-center justify-center">
                  {t.profile_pic ? <img src={t.profile_pic} className="w-full h-full object-cover" /> : <User size={20} style={{ color: 'var(--text-2)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="t-h3 text-white truncate">{t.username}</h3>
                  <p className="t-small" style={{ color: 'var(--text-2)' }}>Level: {t.level || 'beginner'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('badge', t.last_seen ? 'badge-green' : 'badge-amber')}>
                    {t.last_seen ? 'Active' : 'Away'}
                  </span>
                  {t.premium && <Crown size={14} style={{ color: 'var(--amber)' }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProgramsScreen({ user }: { user: User }) {
  const [programs, setPrograms] = useState(PROGRAMS);
  const [activeLevel, setActiveLevel] = useState<Level | 'all'>('all');

  const levels: { key: Level | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'beginner', label: 'Beginner' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced', label: 'Advanced' },
  ];

  const filtered = activeLevel === 'all' ? programs : programs.filter(p => p.level === activeLevel);

  const handleUnlock = (program: Program) => {
    alert(`Premium unlock — $${program.price}`);
    setPrograms(prev => prev.map(p => p.id === program.id ? { ...p, unlocked: true } : p));
  };

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="t-display font-anton text-white">Programs</h1>
        <p className="t-small" style={{ color: 'var(--text-2)' }}>Progress through levels as you grow stronger</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {levels.map(l => (
          <button key={l.key} onClick={() => setActiveLevel(l.key)}
            className={cn('px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
              activeLevel === l.key ? 'bg-[var(--red)] text-white shadow-[var(--shadow-red)]' : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'
            )}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(program => {
          const isUnlocked = program.unlocked || user.premium || program.price === 0;
          return (
            <div key={program.id} className={cn('card overflow-hidden', !isUnlocked && 'opacity-75')}>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative">
                  <img src={program.image} className="w-full h-full object-cover" alt={program.title} />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock size={20} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="t-h3 text-white truncate">{program.title}</h3>
                    <span className={cn('badge ml-2 shrink-0',
                      program.level === 'beginner' ? 'badge-green' :
                      program.level === 'intermediate' ? 'badge-amber' : 'badge-red'
                    )}>
                      {program.level}
                    </span>
                  </div>
                  <p className="t-small mb-2 line-clamp-2" style={{ color: 'var(--text-2)' }}>{program.description}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span className="flex items-center gap-1"><Clock size={12} /> {program.duration}</span>
                    <span>{program.sessions} sessions</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                {isUnlocked ? (
                  <span className="badge badge-green flex items-center gap-1"><CheckCircle size={12} /> Unlocked</span>
                ) : (
                  <span className="t-h3" style={{ color: 'var(--amber)' }}>${program.price}</span>
                )}
                {isUnlocked ? (
                  <button className="btn text-xs flex items-center gap-1.5"><Play size={12} /> Start</button>
                ) : (
                  <button onClick={() => handleUnlock(program)} className="btn text-xs flex items-center gap-1.5"><Crown size={12} /> Unlock</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MessagesScreen({ user }: { user: User }) {
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/messages?action=conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const fetchThread = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/messages?with=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    const token = localStorage.getItem('token');
    const content = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender_id: user.id, receiver_id: activeConv.other_id || activeConv.id, content, created_at: new Date().toISOString() }]);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: activeConv.other_id || activeConv.id, content })
      });
      fetchThread(activeConv.other_id || activeConv.id);
    } catch {}
  };

  if (view === 'chat' && activeConv) {
    const isTrainerView = user.role === 'trainer' || user.role === 'admin';
    const chatName = activeConv.other_name || activeConv.username;
    const chatAvatar = isTrainerView
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatName}`
      : COACH.image;

    return (
      <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col">
        <header className="flex items-center gap-4 px-5 h-16 border-b border-[var(--border)] bg-[var(--bg-2)] shrink-0">
          <button onClick={() => { setView('list'); setActiveConv(null); }} className="text-[var(--text-2)] hover:text-white">
            <ArrowLeft size={22} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface-2)] shrink-0">
            <img src={chatAvatar} className="w-full h-full object-cover" alt={chatName} />
          </div>
          <div>
            <h3 className="t-h3 text-white">{chatName}</h3>
            <p className="t-small" style={{ color: 'var(--green)' }}>Online</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--text-2)' }}>
              <MessageSquare size={36} style={{ color: 'var(--text-3)' }} className="mb-3" />
              <p className="t-body">Send your first message</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isMine = String(m.sender_id) === String(user.id);
            return (
              <div key={m.id || i} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] p-4 rounded-[18px]', isMine ? 'bubble-out' : 'bubble-in')}>
                  <p className="t-body">{m.content}</p>
                  <p className="t-small mt-1 opacity-60">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-5 border-t border-[var(--border)] bg-[var(--bg-2)] flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="field flex-1" />
          <button type="submit" disabled={!input.trim()} className="btn !p-3"><Send size={18} /></button>
        </form>
      </div>
    );
  }

  const isTrainer = user.role === 'trainer' || user.role === 'admin';

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="t-display font-anton text-white">Messages</h1>
        <p className="t-small" style={{ color: 'var(--text-2)' }}>
          {isTrainer ? 'Chat with your trainees' : 'Chat with your coach'}
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" /></div>
      ) : conversations.length === 0 && !isTrainer ? (
        <div className="card text-center py-12">
          <MessageSquare size={40} style={{ color: 'var(--text-3)' }} className="mx-auto mb-4" />
          <p className="t-body mb-4" style={{ color: 'var(--text-2)' }}>Start a conversation with {COACH.name}!</p>
          <button onClick={() => {
            const coach = { other_id: '1', other_name: COACH.name, other_role: 'trainer' };
            setActiveConv(coach);
            setView('chat');
            fetchThread('1');
          }} className="btn">
            Message Coach
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={40} style={{ color: 'var(--text-3)' }} className="mx-auto mb-4" />
          <p className="t-body" style={{ color: 'var(--text-2)' }}>No conversations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv: any) => (
            <div key={conv.other_id} onClick={() => { setActiveConv(conv); setView('chat'); fetchThread(conv.other_id); }}
              className="conv-item cursor-pointer hover:bg-[var(--surface)] transition-colors bg-[var(--surface)] border border-[var(--border)] rounded-xl">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--surface-2)]">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_name}`} className="w-full h-full object-cover" />
                  </div>
                  {conv.unread > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--red)] rounded-full border-2 border-[var(--bg)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="t-h3 text-white">{conv.other_name}</h3>
                    <span className="t-small" style={{ color: 'var(--text-3)' }}>
                      {conv.last_at ? new Date(conv.last_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="t-small truncate" style={{ color: 'var(--text-2)' }}>{conv.last_message || 'Tap to start chatting'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--red)] p-1">
          <div className="w-full h-full rounded-full overflow-hidden bg-[var(--surface-2)]">
            {user.profile_pic ? <img src={user.profile_pic} className="w-full h-full object-cover" /> : <User size={40} style={{ color: 'var(--text-2)' }} className="w-full h-full" />}
          </div>
        </div>
        <div>
          <h1 className="t-h1 text-white">{user.username}</h1>
          <p className="t-label" style={{ color: 'var(--red)' }}>{user.role.toUpperCase()}</p>
          <p className="t-small" style={{ color: 'var(--text-2)' }}>{user.email}</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="t-small" style={{ color: 'var(--text-2)' }}>Membership</span>
          <span className="badge" style={{ background: user.premium ? 'var(--amber-soft)' : 'var(--red-soft)', color: user.premium ? 'var(--amber)' : 'var(--red)' }}>
            {user.premium ? 'Premium' : 'Free'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="t-small" style={{ color: 'var(--text-2)' }}>Level</span>
          <span className="badge badge-green">{user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'Beginner'}</span>
        </div>
      </div>

      <button onClick={onLogout} className="w-full py-4 rounded-xl border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface)] transition-all flex items-center justify-center gap-2">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}

export default function KineticApp() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  if (!user) return <Auth onLogin={(u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); }} />;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isTrainer = user.role === 'trainer' || user.role === 'admin';

  const navItems = [
    { key: 'dashboard' as Screen, icon: isTrainer ? Users : Medal, label: 'Dashboard' },
    { key: 'programs' as Screen, icon: Dumbbell, label: 'Programs' },
    { key: 'messages' as Screen, icon: MessageSquare, label: 'Messages' },
    { key: 'profile' as Screen, icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-inter">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-2)] border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => setShowMenu(!showMenu)} className="text-[var(--text-2)] hover:text-white">
            {showMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-anton text-white tracking-tight">COMRADES</span>
            <span className="text-[var(--red)] text-xl font-anton">GYM</span>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
            {user.profile_pic ? <img src={user.profile_pic} className="w-full h-full object-cover" /> : <User size={16} style={{ color: 'var(--text-2)' }} className="w-full h-full p-1.5" />}
          </div>
        </div>
      </header>

      {showMenu && (
        <div className="fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMenu(false)} />
          <div className="relative bg-[var(--bg-2)] border-b border-[var(--border)] p-5 space-y-2">
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setScreen(item.key); setShowMenu(false); }}
                className={cn('w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all',
                  screen === item.key ? 'bg-[var(--red-soft)] text-[var(--red)]' : 'text-[var(--text-2)] hover:bg-[var(--surface)]')}>
                <item.icon size={20} />
                <span className="t-h3">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto min-h-screen">
        {screen === 'dashboard' && (isTrainer ? <TrainerDashboard user={user} /> : <TraineeDashboard user={user} />)}
        {screen === 'programs' && <ProgramsScreen user={user} />}
        {screen === 'messages' && <MessagesScreen user={user} />}
        {screen === 'profile' && <ProfileScreen user={user} onLogout={handleLogout} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-2)] border-t border-[var(--border)]">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setScreen(item.key)}
              className={cn('flex flex-col items-center gap-0.5 transition-all',
                screen === item.key ? 'text-[var(--red)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]')}>
              <item.icon size={20} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
