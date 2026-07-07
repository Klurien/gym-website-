import { useState } from 'react';
import ProgramCard from '../components/ui/ProgramCard';

const PROGRAMS = [
  { id: '1', title: 'Foundation Strength', description: 'Build your core foundation with compound movements. Perfect for first-timers.', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop' },
  { id: '2', title: 'Bodyweight Mastery', description: 'Master pushups, pullups, and bodyweight fundamentals anywhere.', level: 'beginner', duration: '6 weeks', sessions: 18, price: 0, image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop' },
  { id: '3', title: 'Hypertrophy Accelerator', description: 'Progressive overload programming for lean muscle growth.', level: 'intermediate', duration: '8 weeks', sessions: 24, price: 29, image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop' },
  { id: '4', title: 'Power & Explosiveness', description: 'Olympic lifts and plyometrics for explosive athletic performance.', level: 'intermediate', duration: '6 weeks', sessions: 18, price: 39, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop' },
  { id: '5', title: 'Elite Performance', description: 'Advanced periodization for experienced lifters chasing peak results.', level: 'advanced', duration: '12 weeks', sessions: 36, price: 79, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop' },
  { id: '6', title: 'Certified Coach Program', description: 'Become a certified trainer under expert mentorship.', level: 'advanced', duration: '16 weeks', sessions: 48, price: 149, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop' },
];

export default function Programs({ user, onShowPayment }: { user: any; onShowPayment: (amount: number, programId?: string, name?: string) => void }) {
  const [activeLevel, setActiveLevel] = useState('all');

  const levels = [
    { key: 'all', label: 'ALL' },
    { key: 'beginner', label: 'BEGINNER' },
    { key: 'intermediate', label: 'INTERMEDIATE' },
    { key: 'advanced', label: 'ADVANCED' },
  ];

  const filtered = activeLevel === 'all' ? PROGRAMS : PROGRAMS.filter(p => p.level === activeLevel);

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="font-anton text-4xl text-white uppercase" style={{ lineHeight: 1 }}>PROGRAMS</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>Training plans designed by your coach</p>
      </header>

      {/* Level filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {levels.map(l => (
          <button key={l.key} onClick={() => setActiveLevel(l.key)}
            className="px-5 py-2.5 rounded-full text-xs font-bold tracking-wider whitespace-nowrap transition-all"
            style={activeLevel === l.key
              ? { background: 'var(--red)', color: '#fff', boxShadow: 'var(--shadow-red)' }
              : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Program cards */}
      <div className="space-y-5">
        {filtered.map((program, idx) => {
          const isUnlocked = program.price === 0 || user.premium;
          return (
            <div key={idx}>
              <ProgramCard
                program={program}
                isUnlocked={isUnlocked}
                onUnlock={() => onShowPayment(program.price, program.id, program.title)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
