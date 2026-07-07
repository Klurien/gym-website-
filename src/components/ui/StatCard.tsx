import { useEffect, useRef, useState } from 'react';

export default function StatCard({ label, value, icon: Icon, color, bg, prefix = '', suffix = '' }: {
  label: string; value: number; icon: any; color: string; bg: string; prefix?: string; suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const step = (ts: number) => {
      if (!ref.current) ref.current = ts;
      const progress = Math.min((ts - ref.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    ref.current = undefined;
    requestAnimationFrame(step);
    return () => { ref.current = undefined; };
  }, [value]);

  return (
    <div className="rounded-[16px] p-5 text-center relative overflow-hidden" style={{ background: bg, border: `1px solid ${color}15` }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20" style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${color}20` }}>
          <Icon size={20} style={{ color }} strokeWidth={2.5} />
        </div>
        <p className="font-anton text-3xl text-white" style={{ lineHeight: 1 }}>{prefix}{display}{suffix}</p>
        <p className="t-label mt-1" style={{ color: 'var(--text-3)', fontSize: '0.55rem' }}>{label}</p>
      </div>
    </div>
  );
}
