import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../services/socket';

const API_BASE = '';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [status, setStatus] = useState({ error: '', success: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ error: '', success: '' });
    
    try {
      const endpoint = isLogin ? `${API_BASE}/api/login` : `${API_BASE}/api/register`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
      });
      
      const data = await res.json();
      console.log('Auth response:', res.status, data);

      if (res.ok) {
        if (!isLogin) {
          setStatus({ success: 'Registration complete! Logging in...', error: '' });
          const loginRes = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, password: formData.password })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok) {
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));
            connectSocket(loginData.token);
            setStatus({ success: `Welcome, ${loginData.user.username}!`, error: '' });
            setTimeout(() => navigate('/feed'), 1000);
          } else {
            setStatus({ error: loginData.error || 'Login failed', success: '' });
            setIsLogin(true);
          }
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          connectSocket(data.token);
          setStatus({ success: `Welcome back, ${data.user.username}!`, error: '' });
          setTimeout(() => navigate('/feed'), 1000);
        }
      } else {
        setStatus({ error: data.error || 'Authentication failed', success: '' });
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (err) {
      console.error('Auth error:', err);
      setStatus({ error: 'Network error. Please try again.', success: '' });
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center px-8 pb-20 relative overflow-hidden h-full z-[100] mt-0">
      <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuBSEjHP7QrRZn36afYXkYWwhYMzgsOeYHS1skaXUClEJrCEBYSXYPrCqtDIpKrZ7zQImqCZdnx2if-obOliXGrFkS-IhxiezKagtuXvacy978-LeN5yPBQe7EEbbsgd6H260sALF_bxu2HZMawJHmBZeHBUF-C3bTwHqd191HTZ9aus5dwyDHchV28CuBKMfY59RJ_oezS06FSoRbqb45me7-nWyy7nmFBJAxU196YIy1bvBirwGVLMRrEa2SZac5fXpi-DDtqdADiY')] bg-cover bg-center opacity-10"></div>
      
      <div className="relative z-10 w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-12">
          <h1 className="text-4xl font-black text-lime-400 font-lexend tracking-tighter uppercase leading-none kinetic-glow text-shadow">KINETIC</h1>
          <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1 relative z-10 text-shadow drop-shadow-md">Evolve Together</span>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-[32px] p-container-padding border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-lime-500 to-lime-300"></div>
          
          <h2 className="text-xl font-headline-md text-white mb-6 uppercase">
            {isLogin ? 'Member Access' : 'Begin Journey'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-zinc-500 text-[18px]">person</span>
                  </div>
                  <input 
                    type="text" 
                    required={!isLogin}
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({...formData, username: e.target.value});
                      if (status.error) setStatus({ ...status, error: '' });
                    }}
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20 font-body-md" 
                    placeholder="fitness_guru"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-zinc-500 text-[18px]">mail</span>
                </div>
                <input 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    if (status.error) setStatus({ ...status, error: '' });
                  }}
                  className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20 font-body-md" 
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-zinc-500 text-[18px]">lock</span>
                </div>
                <input 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    if (status.error) setStatus({ ...status, error: '' });
                  }}
                  className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20 font-body-md" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            {status.error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl font-bold flex items-center gap-2 mt-4 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {status.error}
              </div>
            )}
            
            {status.success && (
              <div className="bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs p-3 rounded-xl font-bold flex items-center gap-2 mt-4">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {status.success}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-lime-400 text-black font-label-bold text-label-bold py-4 rounded-xl mt-6 uppercase tracking-widest hover:bg-lime-300 active:scale-95 transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
            >
              {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setStatus({error: '', success: ''}) }}
              className="text-xs text-zinc-500 hover:text-white font-bold transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already a member? Login"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}