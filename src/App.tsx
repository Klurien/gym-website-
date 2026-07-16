import { useState, useEffect } from 'react';
import { Dumbbell, User, Medal, Users, Menu, X, ListTodo, BookOpen } from 'lucide-react';
import { cn } from './lib/utils';
import Auth from './components/Auth';
import PaymentModal from './components/PaymentModal';
import TrainerDashboard from './screens/TrainerDashboard';
import ClientDashboard from './screens/ClientDashboard';
import Programs from './screens/Programs';
import MyCourses from './screens/MyCourses';
import AdminExercises from './screens/AdminExercises';
import Profile from './screens/Profile';

type Screen = 'dashboard' | 'programs' | 'my-courses' | 'exercises' | 'profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [payment, setPayment] = useState<{ amount: number; programId?: string; programName?: string } | null>(null);
  const [exerciseProgramId, setExerciseProgramId] = useState<string | undefined>();
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
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

  const handleLogin = (u: any) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleViewCourse = (programId: string | number) => {
    setSelectedProgramId(String(programId));
    setScreen('my-courses');
  };

  const handleShowExercises = (programId: string | number) => {
    setExerciseProgramId(String(programId));
    setScreen('exercises');
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  const isTrainer = user.role === 'admin';

  const navItems = isTrainer
    ? [
        { key: 'dashboard' as Screen, icon: Users, label: 'HOME' },
        { key: 'programs' as Screen, icon: Dumbbell, label: 'PROGRAMS' },
        { key: 'exercises' as Screen, icon: ListTodo, label: 'EXERCISES' },
        { key: 'profile' as Screen, icon: User, label: 'PROFILE' },
      ]
    : [
        { key: 'dashboard' as Screen, icon: Medal, label: 'HOME' },
        { key: 'programs' as Screen, icon: Dumbbell, label: 'PROGRAMS' },
        { key: 'my-courses' as Screen, icon: BookOpen, label: 'MY COURSES' },
        { key: 'profile' as Screen, icon: User, label: 'PROFILE' },
      ];

  const showPayment = (amount: number, programId?: string, programName?: string) =>
    setPayment({ amount, programId, programName });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 glass"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0"
            style={{ background: showMenu ? 'var(--red-soft)' : 'transparent' }}
          >
            {showMenu
              ? <X size={20} style={{ color: 'var(--red)' }} />
              : <Menu size={20} style={{ color: 'var(--text-2)' }} />}
          </button>
          <div className="flex items-center gap-2 min-w-0 px-2">
            <span className="font-anton text-lg sm:text-xl text-white tracking-tight truncate">COMRADES</span>
            <span className="font-anton text-lg sm:text-xl tracking-tight truncate shrink-0" style={{ color: 'var(--red)' }}>GYM</span>
            {isTrainer && (
              <span
                className="badge text-[7px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 shrink-0"
                style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}
              >
                {user.role === 'admin' ? 'ADMIN' : 'TRAINER'}
              </span>
            )}
          </div>
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
            style={{ border: '2px solid var(--border)', background: 'var(--surface-2)' }}
          >
            {user.profile_pic ? (
              <img src={user.profile_pic} className="w-full h-full object-cover" alt="" />
            ) : (
              <User size={16} style={{ color: 'var(--text-3)' }} />
            )}
          </div>
        </div>
      </header>

      {showMenu && (
        <div className="fixed inset-0 z-40 pt-14 sm:pt-16">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowMenu(false)}
          />
          <div
            className="relative p-4 sm:p-5 space-y-1 animate-fade-in"
            style={{
              background: 'rgba(12,12,12,0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => { setScreen(item.key); setShowMenu(false); }}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all min-h-[52px]',
                  screen === item.key
                    ? 'text-white'
                    : 'text-[var(--text-3)] hover:text-white hover:bg-white/5'
                )}
                style={screen === item.key ? { background: 'var(--red-soft)', color: 'var(--red)' } : {}}
              >
                <item.icon size={20} strokeWidth={2} />
                <span className="t-label text-xs sm:text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {payment && (
        <PaymentModal
          amount={payment.amount}
          programId={payment.programId}
          programName={payment.programName}
          onClose={() => setPayment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <main className="max-w-5xl mx-auto min-h-screen px-0">
        {screen === 'dashboard' && (
          isTrainer
            ? <TrainerDashboard user={user} />
            : <ClientDashboard user={user} onShowPayment={showPayment} onViewCourse={handleViewCourse} />
        )}
        {screen === 'programs' && (
          <Programs user={user} onShowPayment={showPayment} onShowExercises={isTrainer ? handleShowExercises : undefined} />
        )}
        {screen === 'my-courses' && !isTrainer && (
          <MyCourses user={user} selectedProgramId={selectedProgramId} />
        )}
        {screen === 'exercises' && isTrainer && (
          <AdminExercises user={user} initialProgramId={exerciseProgramId} />
        )}
        {screen === 'profile' && <Profile user={user} onLogout={handleLogout} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto flex justify-around items-center h-16 sm:h-[72px] px-4 sm:px-6 lg:px-8">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setScreen(item.key)}
              className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-5 py-2 rounded-xl transition-all relative min-w-0 flex-1"
            >
              {screen === item.key && (
                <span
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--red)' }}
                />
              )}
              <item.icon
                size={20}
                strokeWidth={screen === item.key ? 2.5 : 1.5}
                style={{ color: screen === item.key ? 'var(--red)' : 'var(--text-3)' }}
              />
              <span
                className="t-label truncate w-full text-center leading-tight"
                style={{
                  fontSize: 'clamp(0.45rem, 2vw, 0.55rem)',
                  color: screen === item.key ? 'var(--red)' : 'var(--text-3)',
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
