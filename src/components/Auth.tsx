import { useState, type FormEvent } from 'react';
import { Dumbbell, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth({ onLogin }: { onLogin: (user: any) => void }) {
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
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      if (isLogin) {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else {
        const lr = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const ld = await lr.json();
        if (lr.ok) {
          localStorage.setItem('token', ld.token);
          onLogin(ld.user);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            background: 'radial-gradient(circle, rgba(255,36,66,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,184,0,0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="text-center space-y-3">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
            style={{ background: 'var(--red)', boxShadow: 'var(--shadow-red)' }}
          >
            <Dumbbell size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="t-display text-white">COMRADES</h1>
            <h1 className="t-display" style={{ color: 'var(--red)' }}>
              GYM
            </h1>
          </div>
          <p className="t-label mt-4" style={{ color: 'var(--text-3)' }}>
            {isLogin ? 'Welcome back, athlete' : 'Begin your legacy'}
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
            {['LOGIN', 'REGISTER'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setIsLogin(i === 0)}
                className={cn(
                  'flex-1 py-3 rounded-lg text-xs font-bold tracking-widest transition-all',
                  (i === 0 ? isLogin : !isLogin)
                    ? 'text-white shadow-lg'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                )}
                style={
                  (i === 0 ? isLogin : !isLogin)
                    ? { background: 'var(--surface)', color: 'var(--red)' }
                    : {}
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
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
                <div className="grid grid-cols-2 gap-3">
                  {(['trainee', 'trainer'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="py-3.5 rounded-xl text-xs font-bold tracking-widest transition-all border-2"
                      style={
                        role === r
                          ? {
                              borderColor: 'var(--red)',
                              background: 'var(--red-soft)',
                              color: 'var(--red)',
                            }
                          : {
                              borderColor: 'var(--border)',
                              color: 'var(--text-3)',
                            }
                      }
                    >
                      {r === 'trainee' ? "I'M A CLIENT" : "I'M A TRAINER"}
                    </button>
                  ))}
                </div>
              </>
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
              />
            </div>

            {error && (
              <div
                className="text-center py-3 rounded-xl text-xs font-bold tracking-wider"
                style={{ background: 'var(--red-soft)', color: 'var(--red)' }}
              >
                {error.toUpperCase()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn w-full py-4 justify-center disabled:opacity-50"
            >
              {loading
                ? 'PROCESSING...'
                : isLogin
                  ? 'ENTER THE GYM'
                  : 'JOIN COMRADES'}
              {!loading && <ArrowRight size={16} strokeWidth={3} />}
            </button>
          </form>
        </div>

        <p
          className="text-center t-label"
          style={{ color: 'var(--text-3)', fontSize: '0.55rem' }}
        >
          Forge Your Legacy
        </p>
      </div>
    </div>
  );
}
