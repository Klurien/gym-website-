import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showMenu, setShowMenu] = useState(false);

  const getButtonClass = (path) => {
    const isActive = location.pathname === path || (path === '/' && location.pathname === '/');
    return isActive 
      ? "bg-lime-400 text-black rounded-full p-3 shadow-[0_0_20px_rgba(204,255,0,0.6)]"
      : "text-zinc-400 hover:text-lime-400 p-3";
  };

  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/messages', label: 'Chat', icon: 'chat' },
    { path: '/search', label: 'Search', icon: 'search' },
  ];

  const menuItems = [
    { path: '/community', label: 'Community', icon: 'forum' },
    { path: '/timer', label: 'Timer', icon: 'timer' },
    { path: '/tasks', label: 'Goals', icon: 'checklist' },
    { path: '/calendar', label: 'Calendar', icon: 'event_note' },
    { path: '/notifications', label: 'Alerts', icon: 'notifications' },
    { path: '/profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[60] flex justify-around items-center h-16 px-2 bg-zinc-950/95 backdrop-blur-xl border-t border-white/5">
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} className={getButtonClass(item.path)}>
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
          </button>
        ))}
        
        {/* Menu Button */}
        <button onClick={() => setShowMenu(true)} className={showMenu ? "bg-lime-400 text-black rounded-full p-3" : "text-zinc-400 hover:text-lime-400 p-3"}>
          <span className="material-symbols-outlined text-2xl">apps</span>
        </button>
      </nav>

      {/* Menu Bottom Sheet */}
      {showMenu && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMenu(false)}></div>
          <div className="absolute bottom-20 left-4 right-4 bg-zinc-900 rounded-3xl p-4 animate-slide-up border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-white uppercase">Menu</h3>
              <button onClick={() => setShowMenu(false)} className="text-zinc-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map(item => (
                <button 
                  key={item.path} 
                  onClick={() => { navigate(item.path); setShowMenu(false); }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                    location.pathname === item.path 
                      ? 'bg-lime-400/10 border-lime-400/30 text-lime-400' 
                      : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="font-bold text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}