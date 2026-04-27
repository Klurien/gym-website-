import React, { useState, useEffect } from 'react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Load from localStorage
    const saved = JSON.parse(localStorage.getItem('kinetic_notifications') || '[]');
    setNotifications(saved);
  }, []);

  const markRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('kinetic_notifications', JSON.stringify(updated));
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('kinetic_notifications', JSON.stringify(updated));
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('kinetic_notifications', JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem('kinetic_notifications', JSON.stringify([]));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === filter);

  const getIcon = (type) => {
    switch(type) {
      case 'reminder': return 'alarm_on';
      case 'goal': return 'task_alt';
      case 'like': return 'favorite';
      case 'comment': return 'chat';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'reminder': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'goal': return 'bg-lime-400/10 text-lime-400 border-lime-400/20';
      case 'like': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'comment': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'system': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <main className="pt-28 pb-32 px-6 max-w-lg mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Alerts</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Stay Updated</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-xs font-bold text-lime-400 uppercase tracking-widest"
          >
            Mark all read
          </button>
        )}
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { label: 'All', value: 'all' },
          { label: 'Reminders', value: 'reminder' },
          { label: 'Goals', value: 'goal' }
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase whitespace-nowrap transition-all ${
              filter === f.value 
                ? 'bg-lime-400 text-black' 
                : 'bg-zinc-900/50 text-zinc-400 border border-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <span className="material-symbols-outlined text-5xl mb-4">notifications_none</span>
            <p className="text-sm font-bold uppercase tracking-widest">No notifications</p>
          </div>
        ) : (
          filtered.map((n, i) => (
            <div 
              key={n.id || i}
              onClick={() => markRead(n.id)}
              className={`bg-zinc-900/40 backdrop-blur-xl border rounded-3xl p-5 flex items-start gap-4 hover:bg-zinc-900/60 transition-all cursor-pointer group ${
                n.read ? 'border-white/5' : getColor(n.type).split(' ')[2]
              } ${!n.read ? 'border-lime-400/30' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${getColor(n.type)}`}>
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">{getIcon(n.type)}</span>
              </div>
              <div className="flex-1 space-y-1">
                <p className={`text-sm font-medium leading-relaxed ${n.read ? 'text-zinc-400' : 'text-white'}`}>
                  {n.text}
                </p>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">{n.time}</span>
              </div>
              {!n.read && (
                <span className="w-2 h-2 bg-lime-400 rounded-full shrink-0 mt-2" />
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                className="text-zinc-600 hover:text-red-500 p-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Clear All */}
      {notifications.length > 0 && (
        <button 
          onClick={clearAll}
          className="w-full text-center text-xs font-bold text-zinc-600 uppercase tracking-widest py-4 hover:text-red-500 transition-colors"
        >
          Clear All Notifications
        </button>
      )}

      <div className="text-center pt-4">
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>
      </div>
    </main>
  );
}