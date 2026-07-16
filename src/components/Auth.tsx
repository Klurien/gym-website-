import { useState, type FormEvent } from 'react';
import { Dumbbell, Mail, Lock, User, ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth({ onLogin }: { onLogin: (user: any) => void }) {
  const [mode, setMode] = useState<'client' | 'trainer'>('client');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const isTrainerFlow = mode === 'trainer';
      const url = (isTrainerFlow || isLogin) ? '/api/login' : '/api/register';
      const body = (isTrainerFlow || isLogin)
        ? { email, password }
        : { username: name, email, password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isTrainer = mode === 'trainer';
  const accent = isTrainer ? 'var(--amber)' : 'var(--red)';
  const accentSoft = isTrainer ? 'var(--amber-soft)' : 'var(--red-soft)';
  const shadowAccent = isTrainer ? '0 8px 32px rgba(255,184,0,0.25)' : 'var(--shadow-red)';

  const switchMode = (m: 'client' | 'trainer') => {
    setMode(m);
    setError('');
    setEmail(m === 'trainer' ? 'admin@comrades.com' : '');
    setPassword(m === 'trainer' ? 'admin123' : '');
    setName('');
    setIsLogin(true);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-12 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <div className="absolute top-0 left-0 w-full h-full">
        <div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full"
          style={{
            background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{
            background: `radial-gradient(circle, ${isTrainer ? 'rgba(255,184,0,0.05)' : 'rgba(255,36,66,0.05)'} 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="text-center space-y-3">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
            style={{ background: accent, boxShadow: shadowAccent }}
          >
            {isTrainer
              ? <ShieldCheck size={32} className="text-white" strokeWidth={2} />
              : <Dumbbell size={32} className="text-white" strokeWidth={2.5} />}
          </div>
          <div>
            <h1 className="t-display text-white">
              {isTrainer ? 'TRAINER' : 'COMRADES'}
            </h1>
            <h1 className="t-display" style={{ color: accent }}>
              {isTrainer ? 'PORTAL' : 'GYM'}
            </h1>
          </div>
          <p className="t-label mt-4" style={{ color: 'var(--text-3)' }}>
            {isTrainer
              ? 'Authorized personnel only'
              : isLogin ? 'Welcome back, athlete' : 'Begin your legacy'}
          </p>
        </div>

        <div
          className="rounded-[24px] p-8 space-y-6"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="flex rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
            {(['trainer', 'client'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => switchMode(tab)}
                className={cn(
                  'flex-1 py-3.5 rounded-lg text-xs font-bold tracking-widest transition-all min-h-[48px]',
                  mode === tab ? 'text-white shadow-lg' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                )}
                style={mode === tab ? { background: 'var(--surface)', color: accent } : {}}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab === 'trainer' ? <KeyRound size={14} /> : <User size={14} />}
                  {tab === 'trainer' ? 'TRAINER' : 'CLIENT'}
                </span>
              </button>
            ))}
          </div>

          {!isTrainer && (
            <div className="flex rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
              {['LOGIN', 'REGISTER'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setIsLogin(i === 0)}
                  className={cn(
                    'flex-1 py-3.5 rounded-lg text-xs font-bold tracking-widest transition-all min-h-[48px]',
                    (i === 0 ? isLogin : !isLogin)
                      ? 'text-white shadow-lg'
                      : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                  )}
                  style={
                    (i === 0 ? isLogin : !isLogin)
                      ? { background: 'var(--surface)', color: accent }
                      : {}
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isTrainer && !isLogin && (
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  size={18}
                  style={{ color: 'var(--text-3)' }}
                />
                <input
                  type="text"
                  placeholder="FULL NAME"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="field pl-12"
                />
              </div>
            )}

            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2"
                size={18}
                style={{ color: 'var(--text-3)' }}
              />
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="field pl-12"
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2"
                size={18}
                style={{ color: 'var(--text-3)' }}
              />
              <input
                type="password"
                placeholder="PASSWORD"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="field pl-12"
                autoComplete={isTrainer ? 'current-password' : undefined}
              />
            </div>

            {error && (
              <div
                className="text-center py-3 rounded-xl text-xs font-bold tracking-wider"
                style={{ background: accentSoft, color: accent }}
              >
                {error.toUpperCase()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn w-full py-4 justify-center disabled:opacity-50"
              style={{ background: accent, color: '#fff', boxShadow: shadowAccent }}
            >
              {loading
                ? 'PROCESSING...'
                : isTrainer
                  ? 'ENTER PORTAL'
                  : isLogin
                    ? 'ENTER THE GYM'
                    : 'JOIN COMRADES'}
              {!loading && <ArrowRight size={16} strokeWidth={3} />}
            </button>
          </form>

          {isTrainer && (
            <p
              className="text-center t-label"
              style={{ color: 'var(--text-3)', fontSize: '0.5rem' }}
            >
              Pre-seeded admin account &mdash; no registration required
            </p>
          )}
        </div>

        <p
          className="text-center t-label"
          style={{ color: 'var(--text-3)', fontSize: '0.55rem' }}
        >
          {isTrainer ? 'Manage Your Gym' : 'Forge Your Legacy'}
        </p>
      </div>
    </div>
  );
}
