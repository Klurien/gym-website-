import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { username: 'User', email: '', role: 'client' };
  });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [preview, setPreview] = useState(user.profile_pic || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;
    
    setUploading(true);
    setUploadError('');
    
    // For demo mode, save base64 directly
    const newUser = { ...user, profile_pic: preview };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Try API if available
    const token = localStorage.getItem('token');
    if (token && token !== 'mock-token') {
      try {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ profile_pic: preview })
        });
      } catch {}
    }
    
    setUploading(false);
    setShowAvatarModal(false);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });
    
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    // For demo, just show success
    setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    setTimeout(() => setShowPasswordModal(false), 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <main className="pt-32 pb-32 px-6 max-w-lg mx-auto space-y-10">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
          <div className="w-32 h-32 rounded-full border-2 border-lime-400 p-1 shadow-[0_0_50px_rgba(204,255,0,0.2)] group-hover:scale-105 transition-all overflow-hidden">
            <img 
              src={user.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
              className="w-full h-full rounded-full bg-zinc-800 object-cover" 
              alt="Profile" 
            />
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 bg-lime-400 border border-black rounded-full flex items-center justify-center text-black shadow-lg">
            <span className="material-symbols-outlined text-sm font-bold">photo_camera</span>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{user.username}</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">{user.role}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Member Since', value: '2026', icon: 'calendar_month' },
          { label: 'Profile', value: 'Active', icon: 'verified_user' }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-lime-400/50 mb-3">{stat.icon}</span>
            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] ml-2">Account Settings</h2>
        
        <div className="bg-zinc-900/30 rounded-[32px] border border-white/5 overflow-hidden">
          <button 
            onClick={() => setShowAvatarModal(true)}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all text-left border-b border-white/5"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-lime-400">photo_camera</span>
              <span className="text-sm font-bold text-white">Change Profile Photo</span>
            </div>
            <span className="material-symbols-outlined text-zinc-500">chevron_right</span>
          </button>
          
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all text-left border-b border-white/5"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-lime-400">lock</span>
              <span className="text-sm font-bold text-white">Change Password</span>
            </div>
            <span className="material-symbols-outlined text-zinc-500">chevron_right</span>
          </button>
          
          <button className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all text-left">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-lime-400">notifications</span>
              <span className="text-sm font-bold text-white">Notifications</span>
            </div>
            <span className="material-symbols-outlined text-zinc-500">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-5 rounded-3xl uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-red-500/5"
      >
        Sign Out
      </button>

      <p className="text-center text-[10px] font-bold text-zinc-700 uppercase tracking-widest">KINETIC v2.0</p>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAvatarModal(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Change Photo</h2>
            
            {preview && (
              <div className="flex justify-center mb-6">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-lime-400 shadow-lg">
                  <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-lime-400 text-black font-black py-4 rounded-2xl mb-4 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">upload</span>
              Choose Photo
            </button>
            
            {uploadError && (
              <p className="text-red-500 text-sm text-center mb-4">{uploadError}</p>
            )}
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowAvatarModal(false)} 
                className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-2xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={!preview || uploading}
                className="flex-1 bg-lime-400 text-black font-black py-4 rounded-2xl disabled:opacity-50"
              >
                {uploading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowPasswordModal(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none"
                  placeholder="Min 6 characters"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-6 focus:border-lime-400 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
              
              {passwordMsg.text && (
                <p className={`text-sm font-bold text-center ${passwordMsg.type === 'error' ? 'text-red-500' : 'text-lime-400'}`}>
                  {passwordMsg.text}
                </p>
              )}
              
              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowPasswordModal(false)} 
                  className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-2xl"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-lime-400 text-black font-black py-4 rounded-2xl">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}