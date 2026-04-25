import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const getButtonClass = (path) => {
    const isActive = location.pathname === path || (path === '/feed' && location.pathname === '/');
    return isActive 
      ? "bg-lime-400 text-black rounded-full p-3 shadow-[0_0_20px_rgba(204,255,0,0.6)] active:scale-90 duration-150 transition-all flex items-center justify-center"
      : "text-zinc-500 p-3 hover:text-lime-400 transition-colors active:scale-90 duration-150 flex items-center justify-center";
  };

  const getIconStyle = (path) => {
    const isActive = location.pathname === path || (path === '/feed' && location.pathname === '/');
    return isActive ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" };
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] flex justify-around items-center h-20 px-6 bg-zinc-900/90 backdrop-blur-2xl rounded-full mb-8 mx-10 border border-white/5 shadow-[0px_20px_50px_rgba(0,0,0,0.5)]">
      <button onClick={() => navigate('/feed')} className={getButtonClass('/feed')}>
        <span className="material-symbols-outlined" style={getIconStyle('/feed')}>home</span>
      </button>
      <button onClick={() => navigate('/messages')} className={getButtonClass('/messages')}>
        <span className="material-symbols-outlined" style={getIconStyle('/messages')}>chat</span>
      </button>
      <button onClick={() => navigate('/calendar')} className={getButtonClass('/calendar')}>
        <span className="material-symbols-outlined" style={getIconStyle('/calendar')}>event_note</span>
      </button>
      <button onClick={() => navigate('/tasks')} className={getButtonClass('/tasks')}>
        <span className="material-symbols-outlined" style={getIconStyle('/tasks')}>crisis_alert</span>
      </button>
      {user.role === 'admin' && (
        <button onClick={() => navigate('/admin')} className={getButtonClass('/admin')}>
          <span className="material-symbols-outlined" style={getIconStyle('/admin')}>monitoring</span>
        </button>
      )}
    </nav>
  );
}
