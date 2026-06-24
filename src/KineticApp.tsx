import { useState, useEffect, useRef } from 'react';
import { Dumbbell, MessageSquare, User, Trophy, Crown, Lock, ChevronRight, Send, BarChart3, Users, LogOut, Menu, X, CheckCircle, Play, Target, Clock, Flame, Medal, ArrowLeft, Sparkles, Zap, TrendingUp, Star, Shield } from 'lucide-react';
import { cn } from './lib/utils';
import Auth from './components/Auth';

type Screen = 'dashboard' | 'programs' | 'messages' | 'profile';
type Level = 'beginner' | 'intermediate' | 'advanced';

interface User { id: string; username: string; email: string; role: 'trainee' | 'trainer' | 'admin'; profile_pic?: string; level?: Level; premium?: boolean; }
interface Program { id: string; title: string; description: string; level: Level; duration: string; sessions: number; price: number; image: string; unlocked: boolean; color: string; }
interface Trainee { id: string; username: string; email: string; profile_pic?: string; level: Level; premium: boolean; last_seen?: string; }
interface Message { id: string; sender_id: string; receiver_id: string; content: string; created_at: string; sender_name?: string; }

const PROGRAMS: Program[] = [
  { id: '1', title: 'Foundation Strength', description: 'Build your core with compound movements. Perfect for first-timers.', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop', unlocked: true, color: '#3ECF8E' },
  { id: '2', title: 'Bodyweight Mastery', description: 'Master pushups, pullups, and bodyweight fundamentals.', level: 'beginner', duration: '6 weeks', sessions: 18, price: 0, image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop', unlocked: true, color: '#3ECF8E' },
  { id: '3', title: 'Hypertrophy Accelerator', description: 'Progressive overload for lean muscle growth.', level: 'intermediate', duration: '8 weeks', sessions: 24, price: 29, image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop', unlocked: false, color: '#E8973A' },
  { id: '4', title: 'Power & Explosiveness', description: 'Olympic lifts and plyometrics for athletic performance.', level: 'intermediate', duration: '6 weeks', sessions: 18, price: 39, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop', unlocked: false, color: '#E8973A' },
  { id: '5', title: 'Elite Performance', description: 'Advanced periodization for experienced lifters.', level: 'advanced', duration: '12 weeks', sessions: 36, price: 79, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop', unlocked: false, color: '#E8294A' },
  { id: '6', title: 'Certified Coach', description: 'Full coaching certification under expert mentorship.', level: 'advanced', duration: '16 weeks', sessions: 48, price: 149, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop', unlocked: false, color: '#E8294A' },
];

const COACH = { name: 'Coach Alex', title: 'Head Trainer', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&auto=format&fit=crop', bio: 'Transforming athletes for over a decade.' };

const levelConfig = { beginner: { label: 'Beginner', color: '#3ECF8E', bg: 'rgba(62,207,142,0.12)' }, intermediate: { label: 'Intermediate', color: '#E8973A', bg: 'rgba(232,151,58,0.12)' }, advanced: { label: 'Advanced', color: '#E8294A', bg: 'rgba(232,41,74,0.12)' } };

function greeting() { const h = new Date().getHours(); if (h < 12) return 'Morning'; if (h < 18) return 'Afternoon'; return 'Evening'; }

function ProgressRing({ pct, size = 48, stroke = 4, color = 'var(--red)' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round" />
    </svg>
  );
}

function TraineeDashboard({ user }: { user: User }) {
  const unlocked = PROGRAMS.filter(p => p.unlocked || user.premium || p.price === 0).length;
  const pct = Math.round((unlocked / PROGRAMS.length) * 100);

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header className="relative overflow-hidden rounded-[24px] p-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full opacity-10" style={{ background: 'var(--red)' }} />
        <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 rounded-full opacity-10" style={{ background: 'var(--amber)' }} />
        <div className="relative z-10">
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{greeting()} 👋</p>
          <h1 className="text-3xl font-anton text-white tracking-tight mt-1">{user.username}</h1>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: levelConfig[user.level || 'beginner'].bg, color: levelConfig[user.level || 'beginner'].color }}>
              <Medal size={14} /> {levelConfig[user.level || 'beginner'].label}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: user.premium ? 'rgba(232,151,58,0.12)' : 'rgba(62,207,142,0.12)', color: user.premium ? 'var(--amber)' : 'var(--green)' }}>
              <Shield size={14} /> {user.premium ? 'Premium' : 'Free'}
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-4 p-4 rounded-[20px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: 'var(--red)' }}>
          <img src={COACH.image} className="w-full h-full object-cover" alt={COACH.name} />
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2" style={{ background: 'var(--green)', borderColor: 'var(--surface)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Your Coach</p>
          <h3 className="text-base font-bold text-white">{COACH.name}</h3>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>{COACH.bio}</p>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--text-3)' }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[20px] p-5" style={{ background: 'linear-gradient(135deg, rgba(232,41,74,0.15), transparent)', border: '1px solid rgba(232,41,74,0.2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,41,74,0.2)' }}>
              <TrendingUp size={20} style={{ color: 'var(--red)' }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Progress</span>
          </div>
          <p className="text-3xl font-bold text-white">{pct}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{unlocked}/{PROGRAMS.length} programs</p>
        </div>
        <div className="rounded-[20px] p-5" style={{ background: 'linear-gradient(135deg, rgba(232,151,58,0.15), transparent)', border: '1px solid rgba(232,151,58,0.2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,151,58,0.2)' }}>
              <Flame size={20} style={{ color: 'var(--amber)' }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Streak</span>
          </div>
          <p className="text-3xl font-bold text-white">12</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>day streak 🔥</p>
        </div>
      </div>

      <div className="rounded-[20px] p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Your Programs</h3>
          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{unlocked} unlocked</span>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing pct={pct} size={56} stroke={5} color="var(--red)" />
          <div className="flex-1 space-y-2">
            {(['beginner', 'intermediate', 'advanced'] as Level[]).map(l => {
              const count = PROGRAMS.filter(p => p.level === l).length;
              const unlockedCount = PROGRAMS.filter(p => p.level === l && (p.unlocked || user.premium || p.price === 0)).length;
              const cfg = levelConfig[l];
              return (
                <div key={l} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-xs flex-1" style={{ color: 'var(--text-2)' }}>{cfg.label}</span>
                  <span className="text-xs font-semibold text-white">{unlockedCount}/{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!user.premium && (
        <div className="relative overflow-hidden rounded-[20px] p-5 cursor-pointer group" style={{ background: 'linear-gradient(135deg, rgba(232,41,74,0.2), rgba(232,151,58,0.1))', border: '1px solid rgba(232,41,74,0.3)' }}>
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full" style={{ background: 'rgba(232,41,74,0.15)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Crown size={20} style={{ color: 'var(--amber)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--amber)' }}>Premium</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Unlock All Programs</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>Get access to intermediate & advanced programs starting at $29</p>
            <button className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95" style={{ background: 'var(--red)', boxShadow: 'var(--shadow-red)' }}>
              Upgrade Now
            </button>
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
      .then(data => setTrainees(data.filter((u: any) => u.role === 'trainee')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = trainees.filter(t => t.last_seen);
  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header className="relative overflow-hidden rounded-[24px] p-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full opacity-10" style={{ background: 'var(--red)' }} />
        <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 rounded-full opacity-10" style={{ background: 'var(--amber)' }} />
        <div className="relative z-10">
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{greeting()} 👋</p>
          <h1 className="text-3xl font-anton text-white tracking-tight mt-1">{user.username || 'Coach'}</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>Managing {trainees.length} athletes</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Athletes', value: trainees.length, icon: Users, color: 'var(--red)', bg: 'rgba(232,41,74,0.15)' },
          { label: 'Active', value: active.length, icon: Zap, color: 'var(--green)', bg: 'rgba(62,207,142,0.15)' },
          { label: 'Programs', value: PROGRAMS.length, icon: Dumbbell, color: 'var(--amber)', bg: 'rgba(232,151,58,0.15)' },
        ].map((s, i) => (
          <div key={i} className="rounded-[16px] p-4 text-center" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: `${s.color}20` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-2)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-base font-bold text-white mb-4">Your Athletes</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" /></div>
        ) : trainees.length === 0 ? (
          <div className="rounded-[20px] p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Users size={36} style={{ color: 'var(--text-3)' }} className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No athletes yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Share your gym code to invite them</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trainees.map(t => {
              const lvl = levelConfig[t.level || 'beginner'];
              return (
                <div key={t.id} className="flex items-center gap-4 p-4 rounded-[16px] transition-all hover:translate-x-1 cursor-pointer" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    {t.profile_pic ? <img src={t.profile_pic} className="w-full h-full object-cover" /> : <User size={18} style={{ color: 'var(--text-2)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{t.username}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: lvl.color }} />
                      <span className="text-xs" style={{ color: 'var(--text-2)' }}>{lvl.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: t.last_seen ? 'var(--green)' : 'var(--text-3)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-2)' }}>{t.last_seen ? 'Online' : 'Away'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="rounded-[20px] p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(232,41,74,0.15), transparent)', border: '1px solid rgba(232,41,74,0.2)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,41,74,0.2)' }}>
          <Trophy size={24} style={{ color: 'var(--red)' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">Create a Program</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Design a new training plan for your athletes</p>
        </div>
        <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--red)' }}>
          Create
        </button>
      </div>
    </div>
  );
}

function ProgramsScreen({ user }: { user: User }) {
  const [programs, setPrograms] = useState(PROGRAMS);
  const [activeLevel, setActiveLevel] = useState<Level | 'all'>('all');

  const levels = [
    { key: 'all' as Level | 'all', label: 'All Programs' },
    { key: 'beginner' as Level | 'all', label: 'Beginner' },
    { key: 'intermediate' as Level | 'all', label: 'Intermediate' },
    { key: 'advanced' as Level | 'all', label: 'Advanced' },
  ];

  const filtered = activeLevel === 'all' ? programs : programs.filter(p => p.level === activeLevel);

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-anton text-white tracking-tight">Programs</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Progress through levels designed by your coach</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {levels.map(l => (
          <button key={l.key} onClick={() => setActiveLevel(l.key)}
            className={cn('px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              activeLevel === l.key ? 'text-white shadow-lg' : 'text-[var(--text-2)] border',
              activeLevel === l.key ? '' : 'border-[var(--border)]'
            )}
            style={activeLevel === l.key ? { background: 'var(--red)', boxShadow: 'var(--shadow-red)' } : {}}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((program, idx) => {
          const isUnlocked = program.unlocked || user.premium || program.price === 0;
          const cfg = levelConfig[program.level];
          return (
            <div key={program.id} className={cn('rounded-[20px] overflow-hidden transition-all', !isUnlocked && 'opacity-80')}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="relative h-36 overflow-hidden">
                <img src={program.image} className="w-full h-full object-cover" alt={program.title} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="text-center">
                      <Lock size={28} className="text-white mx-auto mb-1" />
                      <p className="text-xs font-semibold text-white">Locked</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: cfg.color }}>
                    {program.level}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-lg font-bold text-white">{program.title}</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{program.description}</p>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {program.duration}</span>
                  <span className="flex items-center gap-1.5"><BarChart3 size={13} /> {program.sessions} sessions</span>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  {isUnlocked ? (
                    <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
                      <CheckCircle size={14} /> Unlocked
                    </span>
                  ) : (
                    <span className="text-lg font-bold" style={{ color: 'var(--amber)' }}>${program.price}</span>
                  )}
                  {isUnlocked ? (
                    <button className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: 'var(--red)' }}>
                      Start Program
                    </button>
                  ) : (
                    <button className="px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-white transition-all hover:opacity-90 active:scale-95" style={{ background: 'var(--red)', boxShadow: 'var(--shadow-red)' }}
                      onClick={() => { setPrograms(prev => prev.map(p => p.id === program.id ? { ...p, unlocked: true } : p)); }}>
                      <Crown size={14} /> Unlock ${program.price}
                    </button>
                  )}
                </div>
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

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/messages?action=conversations', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setConversations(d.conversations || []); }
    } catch {} finally { setLoading(false); }
  };

  const fetchThread = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/messages?with=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
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
      await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ receiver_id: activeConv.other_id || activeConv.id, content }) });
      fetchThread(activeConv.other_id || activeConv.id);
    } catch {}
  };

  if (view === 'chat' && activeConv) {
    const isTrainer = user.role === 'trainer' || user.role === 'admin';
    const chatName = activeConv.other_name || activeConv.username;
    const chatAvatar = isTrainer ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatName}` : COACH.image;
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)' }}>
        <header className="flex items-center gap-4 px-5 h-16 shrink-0" style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => { setView('list'); setActiveConv(null); }} className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft size={20} style={{ color: 'var(--text-2)' }} />
          </button>
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--surface-2)' }}>
            <img src={chatAvatar} className="w-full h-full object-cover" alt={chatName} />
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: 'var(--green)', borderColor: 'var(--bg-2)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{chatName}</h3>
            <p className="text-xs" style={{ color: 'var(--green)' }}>Online</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ background: 'var(--bg)' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <MessageSquare size={28} style={{ color: 'var(--text-3)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No messages yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Send your coach a message to get started</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isMine = String(m.sender_id) === String(user.id);
            return (
              <div key={m.id || i} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] p-3.5', isMine ? 'rounded-[18px_18px_4px_18px]' : 'rounded-[18px_18px_18px_4px]')}
                  style={isMine ? { background: 'var(--red)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                  <p className={cn('text-[10px] mt-1.5 font-medium', isMine ? 'text-white/60' : 'text-[var(--text-3)]')}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 flex gap-3" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 py-3 px-4 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <button type="submit" disabled={!input.trim()} className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: 'var(--red)' }}>
            <Send size={18} className="text-white" />
          </button>
        </form>
      </div>
    );
  }

  const isTrainer = user.role === 'trainer' || user.role === 'admin';
  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-anton text-white tracking-tight">Messages</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{isTrainer ? 'Chat with your athletes' : 'Chat with your coach'}</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" /></div>
      ) : conversations.length === 0 && !isTrainer ? (
        <div className="rounded-[20px] p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(232,41,74,0.1)' }}>
            <MessageSquare size={28} style={{ color: 'var(--red)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>Message your coach</p>
          <p className="text-xs mb-6" style={{ color: 'var(--text-3)' }}>Ask questions, share progress, get feedback</p>
          <button onClick={() => { const c = { other_id: '1', other_name: COACH.name, other_role: 'trainer' }; setActiveConv(c); setView('chat'); fetchThread('1'); }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'var(--red)', boxShadow: 'var(--shadow-red)' }}>
            Message {COACH.name}
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-[20px] p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Users size={36} style={{ color: 'var(--text-3)' }} className="mx-auto mb-3" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv: any) => (
            <div key={conv.other_id} onClick={() => { setActiveConv(conv); setView('chat'); fetchThread(conv.other_id); }}
              className="flex items-center gap-4 p-4 rounded-[16px] transition-all hover:translate-x-1 cursor-pointer"
              style={{ background: conv.unread ? 'rgba(232,41,74,0.06)' : 'var(--surface)', border: conv.unread ? '1px solid rgba(232,41,74,0.15)' : '1px solid var(--border)' }}>
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--surface-2)' }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_name}`} className="w-full h-full object-cover" />
                {conv.unread > 0 && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: 'var(--red)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className={cn('text-sm', conv.unread ? 'font-bold text-white' : 'font-medium text-white')}>{conv.other_name}</h3>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>{conv.last_at ? new Date(conv.last_at).toLocaleDateString() : ''}</span>
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-2)' }}>{conv.last_message || 'Start a conversation'}</p>
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
      <div className="flex flex-col items-center text-center">
        <div className="relative w-24 h-24 mb-4">
          <div className="w-full h-full rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--red)' }}>
            <div className="w-full h-full rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              {user.profile_pic ? <img src={user.profile_pic} className="w-full h-full object-cover" /> : <User size={36} style={{ color: 'var(--text-2)' }} className="w-full h-full p-2" />}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--red)' }}>
            {user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'B'}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">{user.username}</h1>
        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--red)' }}>{user.role.toUpperCase()}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{user.email}</p>
      </div>

      <div className="rounded-[20px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {[
          { label: 'Membership', value: user.premium ? 'Premium' : 'Free', color: user.premium ? 'var(--amber)' : 'var(--red)', bg: user.premium ? 'rgba(232,151,58,0.12)' : 'rgba(232,41,74,0.12)' },
          { label: 'Level', value: user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'Beginner', color: 'var(--green)', bg: 'rgba(62,207,142,0.12)' },
          { label: 'Role', value: user.role, color: 'var(--amber)', bg: 'rgba(232,151,58,0.12)' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>{item.label}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: item.bg, color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      <button onClick={onLogout} className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
        <div className="flex items-center justify-center gap-2">
          <LogOut size={16} /> Sign Out
        </div>
      </button>

      <p className="text-center text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>COMRADES GYM v1.0</p>
    </div>
  );
}

export default function KineticApp() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
  }, []);

  if (!user) return <Auth onLogin={(u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); }} />;

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  const isTrainer = user.role === 'trainer' || user.role === 'admin';

  const navItems = [
    { key: 'dashboard' as Screen, icon: isTrainer ? Users : Medal, label: 'Home' },
    { key: 'programs' as Screen, icon: Dumbbell, label: 'Programs' },
    { key: 'messages' as Screen, icon: MessageSquare, label: 'Chat' },
    { key: 'profile' as Screen, icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen font-inter" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(10,10,11,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors">
            {showMenu ? <X size={20} style={{ color: 'var(--text-2)' }} /> : <Menu size={20} style={{ color: 'var(--text-2)' }} />}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-anton text-white tracking-tight">COMRADES</span>
            <span className="text-lg font-anton tracking-tight" style={{ color: 'var(--red)' }}>GYM</span>
          </div>
          <div className="w-9 h-9 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            {user.profile_pic ? <img src={user.profile_pic} className="w-full h-full object-cover" /> : <User size={16} style={{ color: 'var(--text-2)' }} className="w-full h-full p-1.5" />}
          </div>
        </div>
      </header>

      {showMenu && (
        <div className="fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMenu(false)} />
          <div className="relative p-5 space-y-1" style={{ background: 'rgba(17,17,20,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setScreen(item.key); setShowMenu(false); }}
                className={cn('w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all',
                  screen === item.key ? 'text-white' : 'text-[var(--text-2)] hover:text-white hover:bg-white/5')}
                style={screen === item.key ? { background: 'rgba(232,41,74,0.12)', color: 'var(--red)' } : {}}>
                <item.icon size={18} />
                <span>{item.label}</span>
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

      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setScreen(item.key)}
              className={cn('flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all relative',
                screen === item.key ? '' : '')}>
              {screen === item.key && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: 'var(--red)' }} />
              )}
              <item.icon size={20} style={{ color: screen === item.key ? 'var(--red)' : 'var(--text-3)' }} />
              <span className="text-[10px] font-medium" style={{ color: screen === item.key ? 'var(--red)' : 'var(--text-3)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
