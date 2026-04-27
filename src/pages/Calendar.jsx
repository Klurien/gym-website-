import React, { useState, useEffect } from 'react';

export default function Calendar() {
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('kinetic_schedules');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1;
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const daySchedules = schedules.filter(s => s.date === dateStr);
    return {
      date,
      dateStr,
      hasSchedule: daySchedules.length > 0,
      isToday: date === today.getDate()
    };
  });

  const todaySchedules = schedules.filter(s => s.date === selectedDate);

  useEffect(() => {
    localStorage.setItem('kinetic_schedules', JSON.stringify(schedules));
  }, [schedules]);

  const handleAddSchedule = (e) => {
    e.preventDefault();
    const form = e.target;
    const newSchedule = {
      id: Date.now(),
      title: form.title.value,
      time: form.time.value,
      date: selectedDate,
      completed: false
    };
    setSchedules([...schedules, newSchedule]);
    setShowAddModal(false);
    form.reset();
  };

  const toggleComplete = (id) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const deleteSchedule = (id) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  return (
    <main className="pt-28 pb-32 px-6 max-w-lg mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{currentMonth}</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Your Schedule</p>
      </header>

      {/* Calendar Grid */}
      <div className="bg-zinc-900/50 rounded-[24px] p-5 border border-white/5">
        <div className="grid grid-cols-7 text-center mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-zinc-600 uppercase">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array(firstDay).fill(null).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`relative p-2 rounded-xl text-sm font-bold transition-all ${
                day.isToday 
                  ? 'bg-lime-400 text-black' 
                  : selectedDate === day.dateStr 
                    ? 'bg-zinc-700 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {day.date}
              {day.hasSchedule && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-white uppercase">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-lime-400 text-black px-4 py-2 rounded-full text-xs font-black uppercase flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add
          </button>
        </div>

        {todaySchedules.length === 0 ? (
          <div className="text-center py-10 text-zinc-500">
            <span className="material-symbols-outlined text-4xl mb-2">event_note</span>
            <p className="text-xs font-bold uppercase tracking-widest">No activities planned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedules.map(schedule => (
              <div 
                key={schedule.id}
                className={`bg-zinc-900/50 border rounded-2xl p-4 flex items-center gap-4 ${
                  schedule.completed ? 'border-lime-400/30' : 'border-white/5'
                }`}
              >
                <button
                  onClick={() => toggleComplete(schedule.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    schedule.completed 
                      ? 'bg-lime-400 border-lime-400' 
                      : 'border-zinc-600 hover:border-lime-400'
                  }`}
                >
                  {schedule.completed && <span className="material-symbols-outlined text-black text-sm">check</span>}
                </button>
                <div className="flex-1">
                  <p className={`font-bold ${schedule.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {schedule.title}
                  </p>
                  <p className="text-xs text-zinc-500">{schedule.time}</p>
                </div>
                <button 
                  onClick={() => deleteSchedule(schedule.id)}
                  className="text-zinc-600 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm">
            <h2 className="text-xl font-black text-white mb-6 uppercase">Add Activity</h2>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Activity</label>
                <input 
                  name="title"
                  required
                  placeholder="e.g. Morning Run, Gym Session"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Time</label>
                <input 
                  name="time"
                  required
                  type="time"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
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