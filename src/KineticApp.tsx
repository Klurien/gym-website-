import { useState, useEffect, useRef } from 'react';
import { Zap, Dumbbell, MessageSquare, User, Trophy, Crown, Lock, ChevronRight, Send, BarChart3, Users, LogOut, Menu, X, ArrowRight, Star, CheckCircle, Play } from 'lucide-react';
import { cn } from './lib/utils';
import Auth from './components/Auth';

type Screen = 'dashboard' | 'programs' | 'messages' | 'profile';
type UserRole = 'trainee' | 'trainer' | 'admin';
type Level = 'beginner' | 'intermediate' | 'advanced';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
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
  trainer: string;
  image: string;
  unlocked: boolean;
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
  { id: '1', title: 'Foundation Strength', description: 'Build your core foundation with basic compound movements. Perfect for first-timers.', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, trainer: 'Alex Rivers', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop', unlocked: true },
  { id: '2', title: 'Bodyweight Mastery', description: 'Master pushups, pullups, and bodyweight fundamentals.', level: 'beginner', duration: '6 weeks', sessions: 18, price: 0, trainer: 'Sarah Kovac', image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop', unlocked: true },
  { id: '3', title: 'Hypertrophy Accelerator', description: 'Progressive overload programming for lean muscle growth.', level: 'intermediate', duration: '8 weeks', sessions: 24, price: 29, trainer: 'Marcus Vane', image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop', unlocked: false },
  { id: '4', title: 'Power & Explosiveness', description: 'Olympic lifts and plyometrics for athletic performance.', level: 'intermediate', duration: '6 weeks', sessions: 18, price: 39, trainer: 'Damon Thorne', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop', unlocked: false },
  { id: '5', title: 'Elite Performance', description: 'Advanced periodization for experienced lifters.', level: 'advanced', duration: '12 weeks', sessions: 36, price: 79, trainer: 'Alex Rivers', image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop', unlocked: false },
  { id: '6', title: 'Certified Coach Program', description: 'Become a certified trainer under expert mentorship.', level: 'advanced', duration: '16 weeks', sessions: 48, price: 149, trainer: 'Sarah Kovac', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop', unlocked: false },
];

const TRAINERS = [
  { id: '1', name: 'Alex Rivers', specialty: 'Strength & Conditioning', rate: '$45/session', available: true, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '2', name: 'Sarah Kovac', specialty: 'Mobility & Recovery', rate: '$55/session', available: true, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '3', name: 'Marcus Vane', specialty: 'Hypertrophy & Nutrition', rate: '$65/session', available: false, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop' },
];

function DashboardScreen({ user }: { user: User }) {
  const [stats, setStats] = useState({ totalClients: 0, activeSessions: 0, unreadMessages: 0 });
  const [trainees, setTrainees] = useState<any[]>([]);

  useEffect(() => {
    if (user.role === 'trainer' || user.role === 'admin') {
      fetch('/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const filtered = data.filter((u: any) => u.role === 'trainee');
          setTrainees(filtered);
          setStats({ totalClients: filtered.length, activeSessions: filtered.filter((t: any) => t.last_seen).length, unreadMessages: 0 });
        })
        .catch(() => {});
    }
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 18) return 'Afternoon';
    return 'Evening';
  };

  if (user.role === 'trainer' || user.role === 'admin') {
    return (
      <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
        <header>
          <h1 className="t-display font-anton text-white">{greeting()}, Trainer</h1>
          <p className="t-small text-[var(--text-2)] mt-1">Command center — {stats.totalClients} active trainees</p>
        </header>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Trainees', value: stats.totalClients, icon: Users, color: 'var(--red)' },
            { label: 'Active', value: stats.activeSessions, icon: BarChart3, color: 'var(--green)' },
            { label: 'Messages', value: stats.unreadMessages, icon: MessageSquare, color: 'var(--amber)' },
          ].map((s, i) => (
            <div key={i} className="card flex flex-col items-center text-center gap-2 py-6">
              <s.icon size={22} style={{ color: s.color }} />
              <span className="t-h1" style={{ color: s.color }}>{s.value}</span>
              <span className="t-label" style={{ color: 'var(--text-2)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="t-h2 text-white">Your Trainees</h2>
            <button className="btn text-xs">View All</button>
          </div>
          <div className="space-y-3">
            {trainees.map((t: any) => (
              <div key={t.id} className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--surface-2)] flex items-center justify-center">
                  {t.profile_pic ? <img src={t.profile_pic} className="w-full h-full object-cover" /> : <User size={20} style={{ color: 'var(--text-2)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="t-h3 text-white truncate">{t.username}</h3>
                  <p className="t-small" style={{ color: 'var(--text-2)' }}>{t.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${t.last_seen ? 'badge-green' : 'badge-amber'}`}>{t.last_seen ? 'Active' : 'Away'}</span>
                  <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                </div>
              </div>
            ))}
            {trainees.length === 0 && (
              <div className="card text-center py-8">
                <p className="t-small" style={{ color: 'var(--text-2)' }}>No trainees assigned yet.</p>
              </div>
            )}
          </div>
        </section>
        <section className="card" style={{ background: 'var(--red-soft)', border: '1px solid var(--red)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--red)] flex items-center justify-center">
              <Trophy size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="t-h3 text-white">Create New Program</h3>
              <p className="t-small" style={{ color: 'var(--text-2)' }}>Design a training plan for your clients</p>
            </div>
            <button className="btn">Create</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="t-display font-anton text-white">{greeting()}, {user.username || 'Trainee'}</h1>
        <p className="t-small" style={{ color: 'var(--text-2)' }}>Your fitness journey at a glance</p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Current Level', value: user.level || 'Beginner', icon: Dumbbell, color: 'var(--red)' },
          { label: 'Programs Active', value: PROGRAMS.filter(p => p.unlocked).length + '/6', icon: Trophy, color: 'var(--green)' },
        ].map((s, i) => (
          <div key={i} className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <s.icon size={20} style={{ color: s.color }} />
              <span className="badge badge-green">Active</span>
            </div>
            <div>
              <p className="t-h1" style={{ color: s.color }}>{s.value}</p>
              <p className="t-label" style={{ color: 'var(--text-2)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <section>
        <h2 className="t-h2 text-white mb-4">Your Trainers</h2>
        <div className="space-y-3">
          {TRAINERS.map(t => (
            <div key={t.id} className="card flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--border)]">
                <img src={t.image} className="w-full h-full object-cover" alt={t.name} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="t-h3 text-white">{t.name}</h3>
                <p className="t-small" style={{ color: 'var(--text-2)' }}>{t.specialty}</p>
                <p className="t-small" style={{ color: 'var(--amber)' }}>{t.rate}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`badge ${t.available ? 'badge-green' : 'badge-amber'}`}>{t.available ? 'Available' : 'Busy'}</span>
                <button className="btn text-xs">Message</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {!user.premium && (
        <section className="card relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--red-soft), transparent)', border: '1px solid var(--red)' }}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Crown size={24} style={{ color: 'var(--amber)' }} />
              <span className="badge" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>NEW</span>
            </div>
            <h3 className="t-h2 text-white mb-1">Go Premium</h3>
            <p className="t-small mb-4" style={{ color: 'var(--text-2)' }}>Unlock intermediate & advanced programs starting at $29</p>
            <button className="btn">Upgrade Now</button>
          </div>
        </section>
      )}
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
    alert(`Premium unlock for "${program.title}" — $${program.price} (mock payment)`);
    setPrograms(prev => prev.map(p => p.id === program.id ? { ...p, unlocked: true } : p));
  };

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="t-display font-anton text-white">Programs</h1>
        <p className="t-small" style={{ color: 'var(--text-2)' }}>Level up your training — unlock as you grow</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {levels.map(l => (
          <button key={l.key} onClick={() => setActiveLevel(l.key)}
            className={cn('px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
              activeLevel === l.key ? 'bg-[var(--red)] text-white shadow-[var(--shadow-red)]' : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--border-active)]'
            )}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(program => {
          const isUnlocked = program.unlocked || user.premium || program.price === 0;
          return (
            <div key={program.id} className={cn('card overflow-hidden', !isUnlocked && 'opacity-70')}>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative">
                  <img src={program.image} className="w-full h-full object-cover" alt={program.title} />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock size={24} className="text-white" />
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
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span>{program.duration}</span>
                    <span>{program.sessions} sessions</span>
                    <span>{program.trainer}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <span className="badge badge-green flex items-center gap-1">
                      <CheckCircle size={12} /> Unlocked
                    </span>
                  ) : (
                    <span className="t-h3" style={{ color: 'var(--amber)' }}>${program.price}</span>
                  )}
                </div>
                {isUnlocked ? (
                  <button className="btn flex items-center gap-2">
                    <Play size={14} /> Start Program
                  </button>
                ) : (
                  <button onClick={() => handleUnlock(program)} className="btn flex items-center gap-2">
                    <Crown size={14} /> Unlock for ${program.price}
                  </button>
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
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
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
    if (!input.trim() || !activeChat) return;
    const token = localStorage.getItem('token');
    const content = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender_id: user.id, receiver_id: activeChat.id, content, created_at: new Date().toISOString() }]);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: activeChat.id, content })
      });
      fetchThread(activeChat.id);
    } catch {}
  };

  if (activeChat) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col">
        <header className="flex items-center gap-4 px-5 h-16 border-b border-[var(--border)] bg-[var(--bg-2)]">
          <button onClick={() => setActiveChat(null)} className="text-[var(--text-2)] hover:text-white"><ChevronRight size={24} className="rotate-180" /></button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface-2)]">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.other_name || activeChat.username}`} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="t-h3 text-white">{activeChat.other_name || activeChat.username}</h3>
            <p className="t-small" style={{ color: 'var(--green)' }}>Online</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="t-display font-anton text-white">Messages</h1>
        <p className="t-small" style={{ color: 'var(--text-2)' }}>Connect with your trainer</p>
      </header>
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[var(--red)] border-t-transparent rounded-full animate-spin" /></div>
      ) : conversations.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare size={40} style={{ color: 'var(--text-3)' }} className="mx-auto mb-4" />
          <p className="t-body" style={{ color: 'var(--text-2)' }}>No conversations yet. Start chatting with your trainer!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv: any) => (
            <div key={conv.other_id} onClick={() => { setActiveChat(conv); fetchThread(conv.other_id); }}
              className="conv-item cursor-pointer hover:bg-[var(--surface)] transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--surface-2)]">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_name}`} className="w-full h-full object-cover" />
                  </div>
                  {conv.unread > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--red)] rounded-full border-2 border-[var(--bg)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="t-h3 text-white">{conv.other_name}</h3>
                    <span className="t-small" style={{ color: 'var(--text-3)' }}>{conv.last_at ? new Date(conv.last_at).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="t-small truncate" style={{ color: 'var(--text-2)' }}>{conv.last_message || 'Start a conversation'}</p>
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
          <span className="badge badge-green">{user.level || 'Beginner'}</span>
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
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  if (!user) return <Auth onLogin={(u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); }} />;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const navItems = [
    { key: 'dashboard' as Screen, icon: BarChart3, label: 'Dashboard' },
    { key: 'programs' as Screen, icon: Dumbbell, label: 'Programs' },
    { key: 'messages' as Screen, icon: MessageSquare, label: 'Messages' },
    { key: 'profile' as Screen, icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-inter">
      {/* Top Bar */}
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

      {/* Menu Overlay */}
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

      {/* Main Content */}
      <main className="max-w-lg mx-auto min-h-screen">
        {screen === 'dashboard' && <DashboardScreen user={user} />}
        {screen === 'programs' && <ProgramsScreen user={user} />}
        {screen === 'messages' && <MessagesScreen user={user} />}
        {screen === 'profile' && <ProfileScreen user={user} onLogout={handleLogout} />}
      </main>

      {/* Bottom Nav */}
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
