import React, { useState, useEffect } from 'react';

export default function Tasks() {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('kinetic_goals');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Complete 30 min cardio', time: '07:00', done: false, notified: false },
      { id: 2, text: 'Drink 3L water', time: '12:00', done: false, notified: false },
      { id: 3, text: 'Read 20 pages', time: '21:00', done: false, notified: false }
    ];
  });
  const [newGoal, setNewGoal] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    localStorage.setItem('kinetic_goals', JSON.stringify(goals));
    
    // Save to notifications for due tasks
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    goals.forEach(goal => {
      if (!goal.done && !goal.notified && goal.time <= currentTime) {
        // Add to notifications
        const notifications = JSON.parse(localStorage.getItem('kinetic_notifications') || '[]');
        if (!notifications.find(n => n.goalId === goal.id && n.type === 'reminder')) {
          notifications.unshift({
            id: Date.now(),
            type: 'reminder',
            text: `Task due: ${goal.text}`,
            time: 'Just now',
            goalId: goal.id,
            read: false
          });
          localStorage.setItem('kinetic_notifications', JSON.stringify(notifications));
        }
        
        // Mark as notified
        setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, notified: true } : g));
        
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('KINETIC', { body: goal.text });
        }
      }
    });
  }, [goals]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleGoal = (id) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addGoal = (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    
    setGoals([...goals, {
      id: Date.now(),
      text: newGoal,
      time: newTime,
      done: false,
      notified: false
    }]);
    
    setNewGoal('');
    setShowAdd(false);
  };

  const completedCount = goals.filter(g => g.done).length;
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;
  const pendingGoals = goals.filter(g => !g.done).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <main className="pt-28 pb-32 px-6 max-w-lg mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Daily Goals</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">Track Your Progress</p>
      </header>

      {/* Progress Bar */}
      <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Progress</span>
          <span className="text-sm font-black text-lime-400">{progress}%</span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-lime-500 to-lime-300 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-[10px] text-zinc-600 mt-2">{completedCount} of {goals.length} completed</p>
      </div>

      {/* Pending Goals */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Pending</h2>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-lime-400 text-black px-4 py-2 rounded-full text-xs font-black uppercase flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Goal
          </button>
        </div>

        {pendingGoals.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <span className="material-symbols-outlined text-5xl mb-3 text-lime-400">emoji_events</span>
            <p className="text-sm font-bold uppercase tracking-widest">All goals completed!</p>
          </div>
        ) : (
          pendingGoals.map(goal => {
            const isOverdue = goal.time < new Date().toTimeString().slice(0, 5);
            return (
              <div 
                key={goal.id}
                className={`bg-zinc-900/50 border rounded-2xl p-4 flex items-center gap-4 ${
                  isOverdue ? 'border-red-500/30' : 'border-white/5'
                }`}
              >
                <button
                  onClick={() => toggleGoal(goal.id)}
                  className="w-7 h-7 rounded-full border-2 border-zinc-600 hover:border-lime-400 hover:bg-lime-400/10 flex items-center justify-center transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-zinc-500 text-sm">add</span>
                </button>
                <div className="flex-1">
                  <p className="font-bold text-white">{goal.text}</p>
                  <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-zinc-500'}`}>
                    {isOverdue ? 'Overdue' : goal.time}
                  </p>
                </div>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="text-zinc-600 hover:text-red-500 p-2"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Completed */}
      {goals.filter(g => g.done).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Completed</h2>
          {goals.filter(g => g.done).map(goal => (
            <div 
              key={goal.id}
              className="bg-zinc-900/30 border border-lime-400/20 rounded-2xl p-4 flex items-center gap-4"
            >
              <button
                onClick={() => toggleGoal(goal.id)}
                className="w-7 h-7 rounded-full bg-lime-400 border-2 border-lime-400 flex items-center justify-center shrink-0"
              >
                <span className="material-symbols-outlined text-black text-sm">check</span>
              </button>
              <div className="flex-1">
                <p className="font-bold text-zinc-500 line-through">{goal.text}</p>
              </div>
              <button 
                onClick={() => deleteGoal(goal.id)}
                className="text-zinc-700 hover:text-zinc-500 p-2"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAdd(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm">
            <h2 className="text-xl font-black text-white mb-6 uppercase">New Goal</h2>
            <form onSubmit={addGoal} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Goal</label>
                <input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  required
                  placeholder="What do you want to achieve?"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Remind At</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-2xl"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-lime-400 text-black font-black py-4 rounded-2xl">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}