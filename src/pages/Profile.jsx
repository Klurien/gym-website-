import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarInput, setAvatarInput] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`);
  
  const [customTasks, setCustomTasks] = useState(() => {
    const saved = localStorage.getItem('kinetic_tasks_list');
    return saved ? JSON.parse(saved) : [
      { id: Date.now(), text: 'Morning Mobility Flow', time: '08:00 AM', done: false }
    ];
  });

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('kinetic_tasks_list', JSON.stringify(customTasks));
  }, [customTasks]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const addTask = (e) => {
    e.preventDefault();
    const text = e.target.taskText.value;
    if (!text) return;
    setCustomTasks([...customTasks, { id: Date.now(), text, time: 'Daily', done: false }]);
    e.target.reset();
  };

  const removeTask = (id) => {
    setCustomTasks(customTasks.filter(t => t.id !== id));
  };

  const handleUpdateAvatar = () => {
    const newUser = { ...user, profile_pic: avatarInput };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    setShowAvatarModal(false);
  };

  return (
    <main className="pt-32 pb-32 px-6 max-w-lg mx-auto space-y-10">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
          <div className="w-32 h-32 rounded-full border-2 border-lime-400 p-1 shadow-[0_0_50px_rgba(204,255,0,0.2)] group-hover:scale-105 transition-all">
            <img 
              src={user.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
              className="w-full h-full rounded-full bg-zinc-800 object-cover" 
              alt="Profile" 
            />
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 bg-lime-400 border border-black rounded-full flex items-center justify-center text-black">
            <span className="material-symbols-outlined text-sm font-bold">edit</span>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{user.username}</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">Growth Mindset</p>
        </div>
      </div>

      {/* Self-Improvement Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Consistency', value: '42 Days', icon: 'auto_graph' },
          { label: 'Tasks Finished', value: customTasks.filter(t => t.done).length, icon: 'task_alt' },
          { label: 'Growth Phase', value: 'Alpha', icon: 'eco' },
          { label: 'Current Chores', value: customTasks.length, icon: 'format_list_bulleted' }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center group">
            <span className="material-symbols-outlined text-lime-400/50 mb-3">{stat.icon}</span>
            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Task Editor Trigger */}
      <button 
        onClick={() => setShowTaskEditor(true)}
        className="w-full bg-lime-400 text-black font-black py-5 rounded-3xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <span className="material-symbols-outlined font-bold">edit_note</span>
        Manage My Chores
      </button>

      {/* Actions Section */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] ml-2">Personal Settings</h2>
        
        <div className="bg-zinc-900/30 rounded-[32px] border border-white/5 overflow-hidden">
          {[
            { label: 'Membership Level', icon: 'payments', value: 'Premium' },
            { label: 'Privacy & Security', icon: 'lock', value: 'Direct' },
            { label: 'Global Language', icon: 'language', value: 'English' }
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all text-left border-b border-white/5 last:border-0">
               <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-zinc-500">{item.icon}</span>
                  <span className="text-sm font-bold text-white">{item.label}</span>
               </div>
               <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{item.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-5 rounded-3xl uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-red-500/5"
      >
        Terminate Session
      </button>

      <p className="text-center text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Self-Improvement Protocol v1.0</p>

      {/* Modals */}
      {showTaskEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowTaskEditor(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Edit Chores</h2>
            <form onSubmit={addTask} className="space-y-4 mb-8">
              <input name="taskText" required type="text" placeholder="Add new daily chore..." className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none" />
              <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl">Add Task</button>
            </form>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {customTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-black/30 p-4 rounded-2xl border border-white/5">
                  <span className="text-sm font-bold text-zinc-300">{t.text}</span>
                  <button onClick={() => removeTask(t.id)} className="text-red-500 hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTaskEditor(false)} className="w-full mt-8 bg-zinc-800 text-white font-bold py-4 rounded-2xl">Close</button>
          </div>
        </div>
      )}

      {showAvatarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAvatarModal(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Change Avatar</h2>
            <div className="space-y-6">
              <div className="flex justify-center">
                 <img src={avatarInput} className="w-24 h-24 rounded-full border-2 border-lime-400" alt="Preview" />
              </div>
              <input 
                type="text" 
                value={avatarInput} 
                onChange={e => setAvatarInput(e.target.value)}
                placeholder="Avatar URL..." 
                className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none text-xs" 
              />
              <div className="flex gap-4">
                <button onClick={() => setShowAvatarModal(false)} className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-2xl">Cancel</button>
                <button onClick={handleUpdateAvatar} className="flex-1 bg-lime-400 text-black font-black py-4 rounded-2xl">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
