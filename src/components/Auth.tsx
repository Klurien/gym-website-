import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'client' | 'trainer'>('client');

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
        : { username: name, email, password };

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
        // Auto-login after register
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
    <div className="min-h-screen flex items-center justify-center bg-kinetic-bg px-5 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-kinetic-lime/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-kinetic-lime/5 blur-[120px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kinetic-lime shadow-[0_0_30px_rgba(195,244,0,0.4)] mb-6">
            <Zap size={32} className="text-black" fill="black" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-lexend">KINETIC</h2>
          <p className="mt-2 text-zinc-500 font-medium uppercase tracking-[0.2em] text-[10px]">
            {isLogin ? 'Welcome back to the chain' : 'Begin your performance journey'}
          </p>
        </div>

        <div className="kinetic-glass p-8 rounded-[32px] border border-white/5 space-y-6">
          <div className="flex bg-zinc-900 rounded-2xl p-1">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-black tracking-widest transition-all",
                isLogin ? "bg-zinc-800 text-kinetic-lime shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              LOGIN
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-black tracking-widest transition-all",
                !isLogin ? "bg-zinc-800 text-kinetic-lime shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input 
                    type="text" 
                    placeholder="FULL NAME"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-kinetic-lime/30 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setRole('client')}
                    className={cn(
                      "py-3 rounded-2xl border text-[10px] font-black tracking-widest transition-all",
                      role === 'client' ? "border-kinetic-lime bg-kinetic-lime/10 text-kinetic-lime" : "border-white/10 text-zinc-500"
                    )}
                  >
                    I'M A CLIENT
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('trainer')}
                    className={cn(
                      "py-3 rounded-2xl border text-[10px] font-black tracking-widest transition-all",
                      role === 'trainer' ? "border-kinetic-lime bg-kinetic-lime/10 text-kinetic-lime" : "border-white/10 text-zinc-500"
                    )}
                  >
                    I'M A TRAINER
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-kinetic-lime/30 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="password" 
                placeholder="PASSWORD"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-kinetic-lime/30 transition-all"
              />
            </div>

            {error && (
              <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-[9px] font-black text-zinc-600 hover:text-kinetic-lime uppercase tracking-widest">
                  Forgot Password?
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-kinetic-lime text-black py-4 rounded-2xl font-black text-xs tracking-[0.2em] shadow-[0_0_20px_rgba(195,244,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : (isLogin ? 'ENTER CHAIN' : 'ESTABLISH PROFILE')}
              {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

        <p className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
          By continuing you agree to the <span className="text-zinc-400">Kinetic Protocols</span>
        </p>
      </motion.div>
    </div>
  );
}
