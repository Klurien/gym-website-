import { useState, useEffect } from 'react';
import { Dumbbell, User, Medal, Users, Menu, X } from 'lucide-react';
import { cn } from './lib/utils';
import Auth from './components/Auth';
import PaymentModal from './components/PaymentModal';
import TrainerDashboard from './screens/TrainerDashboard';
import ClientDashboard from './screens/ClientDashboard';
import Programs from './screens/Programs';
import Profile from './screens/Profile';

type Screen = 'dashboard' | 'programs' | 'profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [payment, setPayment] = useState<{ amount: number; programId?: string; programName?: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
  }, []);

  const handlePaymentSuccess = () => {
    if (user) {
      const updated = { ...user, premium: true };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
    setPayment(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <Auth onLogin={(u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); }} />;

  const isTrainer = user.role === 'trainer' || user.role === 'admin';
  const navItems = [
    { key: 'dashboard' as Screen, icon: isTrainer ? Users : Medal, label: 'HOME' },
    { key: 'programs' as Screen, icon: Dumbbell, label: 'PROGRAMS' },
    { key: 'profile' as Screen, icon: User, label: 'PROFILE' },
  ];

  const showPayment = (amount: number, programId?: string, programName?: string) => setPayment({ amount, programId, programName });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-inter)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ background: showMenu ? 'var(--red-soft)' : 'transparent' }}>
            {showMenu ? <X size={20} style={{ color: 'var(--red)' }} /> : <Menu size={20} style={{ color: 'var(--text-2)' }} />}
          </button>
          <div className="flex items-center gap-1">
            <span className="font-anton text-xl text-white tracking-tight">COMRADES</span>
            <span className="font-anton text-xl tracking-tight" style={{ color: 'var(--red)' }}>GYM</span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: '2px solid var(--border)', background: 'var(--surface-2)' }}>
            {user.profile_pic ? <img src={user.profile_pic} className="w-full h-full object-cover" alt="" /> : <User size={16} style={{ color: 'var(--text-3)' }} className="w-full h-full p-2" />}
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowMenu(false)} />
          <div className="relative p-5 space-y-1" style={{ background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setScreen(item.key); setShowMenu(false); }}
                className={cn('w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all',
                  screen === item.key ? 'text-white' : 'text-[var(--text-3)] hover:text-white hover:bg-white/5')}
                style={screen === item.key ? { background: 'var(--red-soft)', color: 'var(--red)' } : {}}>
                <item.icon size={20} strokeWidth={2} />
                <span className="t-label" style={{ fontSize: '0.7rem' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payment && (
        <PaymentModal amount={payment.amount} programId={payment.programId} programName={payment.programName}
          onClose={() => setPayment(null)} onSuccess={handlePaymentSuccess} />
      )}

      {/* Screens */}
      <main className="max-w-lg mx-auto min-h-screen">
        {screen === 'dashboard' && (isTrainer
          ? <TrainerDashboard user={user} />
          : <ClientDashboard user={user} onShowPayment={showPayment} />)}
        {screen === 'programs' && <Programs user={user} onShowPayment={showPayment} />}
        {screen === 'profile' && <Profile user={user} onLogout={handleLogout} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setScreen(item.key)}
              className="flex flex-col items-center gap-1 px-5 py-1 rounded-xl transition-all relative">
              {screen === item.key && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: 'var(--red)' }} />
              )}
              <item.icon size={22} strokeWidth={screen === item.key ? 2.5 : 1.5} style={{ color: screen === item.key ? 'var(--red)' : 'var(--text-3)' }} />
              <span className="t-label" style={{ fontSize: '0.5rem', color: screen === item.key ? 'var(--red)' : 'var(--text-3)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
