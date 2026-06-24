import { useState, type FormEvent } from 'react';
import { Dumbbell, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'trainee' | 'trainer'>('trainee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = isLogin ? '/api/login' : '/api/register';
      const body = isLogin
        ? { email, password }
        : { username: name, email, password, role };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else {
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          localStorage.setItem('token', loginData.token);
          onLogin(loginData.user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-5 py-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--red-soft)] blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--amber-soft)] blur-[120px]"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--red)] shadow-[var(--shadow-red)] mb-6">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-anton text-white tracking-tight uppercase">COMRADES</h2>
          <span className="text-4xl font-anton text-[var(--red)] tracking-tight uppercase">GYM</span>
          <p className="mt-2 text-[var(--text-2)] font-medium uppercase tracking-[0.2em] text-[10px]">
            {isLogin ? 'Welcome back, athlete' : 'Begin your legacy'}
          </p>
        </div>

        <div className="card p-8 space-y-6">
          <div className="flex bg-[var(--surface-2)] rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-semibold tracking-widest transition-all",
                isLogin ? "bg-[var(--surface)] text-[var(--red)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"
              )}
            >
              LOGIN
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-semibold tracking-widest transition-all",
                !isLogin ? "bg-[var(--surface)] text-[var(--red)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"
              )}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" size={18} />
                  <input
                    type="text"
                    placeholder="FULL NAME"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field pl-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('trainee')}
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-semibold tracking-widest transition-all",
                      role === 'trainee' ? "border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]" : "border-[var(--border)] text-[var(--text-2)]"
                    )}
                  >
                    I'M A TRAINEE
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('trainer')}
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-semibold tracking-widest transition-all",
                      role === 'trainer' ? "border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]" : "border-[var(--border)] text-[var(--text-2)]"
                    )}
                  >
                    I'M A TRAINER
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" size={18} />
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field pl-12"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" size={18} />
              <input
                type="password"
                placeholder="PASSWORD"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pl-12"
              />
            </div>

            {error && (
              <div className="text-[var(--red)] text-[10px] font-semibold uppercase tracking-widest text-center bg-[var(--red-soft)] p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn w-full py-4 justify-center text-sm tracking-widest disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : (isLogin ? 'ENTER' : 'JOIN COMRADES')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="text-center text-[9px] text-[var(--text-3)] font-semibold uppercase tracking-[0.2em]">
          Forge Your Legacy
        </p>
      </div>
    </div>
  );
}
