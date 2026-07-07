import { User, LogOut, Shield, Medal, Mail } from 'lucide-react';

export default function Profile({ user, onLogout }: { user: any; onLogout: () => void }) {
  const lvl = (user.level || 'beginner').toUpperCase();

  return (
    <div className="px-5 pt-20 pb-32 space-y-6 animate-fade-in">
      {/* Avatar */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative w-28 h-28">
          <div className="w-full h-full rounded-full overflow-hidden border-3" style={{ borderColor: 'var(--red)', borderWidth: 3 }}>
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
              {user.profile_pic
                ? <img src={user.profile_pic} className="w-full h-full object-cover" alt="" />
                : <User size={40} style={{ color: 'var(--text-3)' }} strokeWidth={1.5} />}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--red)' }}>
            {lvl}
          </div>
        </div>
        <div>
          <h1 className="font-anton text-3xl text-white uppercase" style={{ lineHeight: 1 }}>{user.username}</h1>
          <p className="t-label mt-1" style={{ color: 'var(--red)' }}>{user.role.toUpperCase()}</p>
          <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: 'var(--text-2)' }}>
            <Mail size={12} /> {user.email}
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="rounded-[20px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {[
          { label: 'MEMBERSHIP', value: user.premium ? 'PREMIUM' : 'FREE', icon: Shield, color: user.premium ? 'var(--amber)' : 'var(--text-2)', bg: user.premium ? 'var(--amber-soft)' : 'rgba(255,255,255,0.05)' },
          { label: 'LEVEL', value: lvl, icon: Medal, color: 'var(--green)', bg: 'var(--green-soft)' },
          { label: 'ROLE', value: user.role.toUpperCase(), icon: User, color: 'var(--amber)', bg: 'var(--amber-soft)' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div className="flex items-center gap-3">
              <item.icon size={16} style={{ color: 'var(--text-3)' }} />
              <span className="t-label" style={{ color: 'var(--text-2)', fontSize: '0.6rem' }}>{item.label}</span>
            </div>
            <span className="badge" style={{ background: item.bg, color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={onLogout} className="btn-outline w-full py-4 justify-center flex items-center gap-2">
        <LogOut size={16} /> SIGN OUT
      </button>

      <p className="text-center t-label" style={{ color: 'var(--text-3)', fontSize: '0.5rem' }}>COMRADES GYM v2.0</p>
    </div>
  );
}
