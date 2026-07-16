import { Lock, CheckCircle, Crown, Clock, BarChart3 } from 'lucide-react';

const levelColors: Record<string, { color: string }> = {
  beginner: { color: '#00D26A' },
  intermediate: { color: '#FFB800' },
  advanced: { color: '#FF2442' },
};

export default function ProgramCard({
  program,
  isUnlocked,
  onUnlock,
  onStart,
}: {
  program: {
    id: string | number;
    title: string;
    description: string;
    level: string;
    duration: string;
    sessions: number;
    price: number;
    image: string;
  };
  isUnlocked: boolean;
  onUnlock?: () => void;
  onStart?: () => void;
}) {
  const cfg = levelColors[program.level] || levelColors.beginner;

  return (
    <div
      className="rounded-[20px] overflow-hidden transition-all duration-300 hover:scale-[1.01]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={program.image}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          alt={program.title}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)',
          }}
        />

        {!isUnlocked && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          >
            <div className="text-center space-y-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                <Lock size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <p className="t-label text-white">LOCKED</p>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span className="badge" style={{ background: cfg.color, color: '#000' }}>
            {program.level}
          </span>
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3
            className="font-anton text-xl text-white uppercase"
            style={{ lineHeight: 1.1 }}
          >
            {program.title}
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
          {program.description}
        </p>

        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {program.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart3 size={13} /> {program.sessions} sessions
          </span>
        </div>

        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {isUnlocked ? (
            <span className="badge" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
              <CheckCircle size={12} /> UNLOCKED
            </span>
          ) : (
            <span className="font-anton text-2xl" style={{ color: 'var(--amber)', lineHeight: 1 }}>
              KES {program.price}
            </span>
          )}
          {isUnlocked ? (
            <button onClick={onStart} className="btn py-3 px-5">
              START
            </button>
          ) : (
            <button onClick={onUnlock} className="btn py-3 px-5">
              <Crown size={14} strokeWidth={2.5} /> UNLOCK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
