import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path) => location.pathname === path;
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 h-16 bg-zinc-900/80 backdrop-blur-xl rounded-2xl mt-4 mx-5 border border-white/10 shadow-[0px_10px_30px_rgba(204,255,0,0.15)]">
      <div className="flex items-center gap-4">
        <button className="active:scale-95 hover:scale-105 transition-all text-lime-400">
          <span className="material-symbols-outlined font-variation-settings-'FILL' 1" style={{ fontVariationSettings: "'FILL' 0" }}>menu</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black text-lime-400 font-lexend tracking-tighter uppercase leading-none">KINETIC</h1>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">Global Elite Coach</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/notifications')}
          className={`active:scale-95 hover:scale-105 transition-all ${isActive('/notifications') ? 'text-lime-400' : 'text-zinc-500'}`}
        >
          <span className="material-symbols-outlined" style={isActive('/notifications') ? { fontVariationSettings: "'FILL' 1" } : {}}>notifications</span>
        </button>
        <button 
          onClick={() => navigate('/profile')}
          className={`w-8 h-8 rounded-full border overflow-hidden transition-all active:scale-95 ${isActive('/profile') ? 'border-lime-400 ring-2 ring-lime-400/20' : 'border-zinc-700'}`}
        >
          <img 
            alt="Profile" 
            className="w-full h-full object-cover" 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
          />
        </button>
      </div>
    </header>
  );
}
