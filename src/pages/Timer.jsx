import React, { useState, useEffect, useRef } from 'react';

export default function Timer() {
  const [mode, setMode] = useState('workout'); // 'workout' or 'rest'
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  
  // Rest timer settings
  const [restDuration, setRestDuration] = useState(90); // seconds
  const [restRemaining, setRestRemaining] = useState(90);
  const [isResting, setIsResting] = useState(false);
  
  // Presets
  const presets = [
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
  ];
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Workout timer
  useEffect(() => {
    if (isRunning && mode === 'workout') {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  // Rest countdown
  useEffect(() => {
    if (isResting && restRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setRestRemaining(prev => prev - 1);
      }, 1000);
    } else if (isResting && restRemaining === 0) {
      playAlarm();
      setIsResting(false);
      setRestRemaining(restDuration);
    }
    return () => clearInterval(intervalRef.current);
  }, [isResting, restRemaining, restDuration]);

  const playAlarm = () => {
    // Create beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    
    // Beep pattern
    setTimeout(() => { oscillator.stop(); }, 200);
    setTimeout(() => { 
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    }, 300);
    setTimeout(() => {
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    }, 600);
  };

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startWorkout = () => {
    setIsRunning(true);
    setMode('workout');
  };

  const pauseWorkout = () => {
    setIsRunning(false);
  };

  const resetWorkout = () => {
    setIsRunning(false);
    setSeconds(0);
    setWorkoutTime(0);
  };

  const startRest = () => {
    setIsResting(true);
    setRestRemaining(restDuration);
    setMode('rest');
  };

  const cancelRest = () => {
    setIsResting(false);
    setRestRemaining(restDuration);
    setMode('workout');
  };

  const setPreset = (value) => {
    setRestDuration(value);
    setRestRemaining(value);
  };

  return (
    <main className="pt-28 pb-32 px-6 max-w-lg mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Timer</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">
          {mode === 'workout' ? 'Workout Duration' : 'Rest Period'}
        </p>
      </header>

      {/* Main Timer Display */}
      <div className="bg-zinc-900/50 rounded-[32px] p-10 border border-white/5 text-center">
        {/* Big Timer */}
        <div className="text-7xl font-black text-white mb-4 tabular-nums">
          {mode === 'rest' ? formatTime(restRemaining) : formatTime(seconds)}
        </div>
        
        {/* Mode Indicator */}
        <div className={`inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
          mode === 'rest' ? 'bg-amber-500/20 text-amber-500' : 'bg-lime-400/20 text-lime-400'
        }`}>
          {mode === 'rest' ? 'Rest' : 'Working Out'}
        </div>
        
        {/* Progress Ring */}
        {mode === 'rest' && (
          <div className="relative w-48 h-48 mx-auto mt-6">
            <svg className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800" />
              <circle 
                cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="8" 
                className="text-amber-500"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - (restRemaining / restDuration))}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-black text-white">{restRemaining}s</span>
            </div>
          </div>
        )}
      </div>

      {/* Workout Controls */}
      {!isResting && (
        <div className="space-y-4">
          {!isRunning ? (
            <button 
              onClick={startWorkout}
              className="w-full bg-lime-400 text-black font-black py-6 rounded-3xl uppercase tracking-widest text-lg shadow-lg shadow-lime-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Start Workout
            </button>
          ) : (
            <button 
              onClick={pauseWorkout}
              className="w-full bg-amber-500 text-black font-black py-6 rounded-3xl uppercase tracking-widest text-lg shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined">pause</span>
              Pause
            </button>
          )}
          
          <div className="flex gap-4">
            <button 
              onClick={resetWorkout}
              className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">refresh</span>
              Reset
            </button>
            <button 
              onClick={startRest}
              className="flex-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black py-4 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">timer</span>
              Start Rest
            </button>
          </div>
        </div>
      )}

      {/* Rest Timer Controls */}
      {isResting && (
        <div className="space-y-4">
          <button 
            onClick={cancelRest}
            className="w-full bg-red-500/20 text-red-500 border border-red-500/30 font-black py-6 rounded-3xl uppercase tracking-widest text-lg flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">stop</span>
            Cancel Rest
          </button>
          <p className="text-center text-xs text-zinc-500 uppercase tracking-widest">Rest timer running...</p>
        </div>
      )}

      {/* Rest Duration Presets */}
      {!isResting && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] text-center">Rest Duration</h3>
          <div className="flex gap-2 justify-center">
            {presets.map(p => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-5 py-3 rounded-2xl font-black text-sm transition-all ${
                  restDuration === p.value 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-zinc-900/50 text-zinc-400 border border-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Time */}
      {!isResting && isRunning && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] text-center">Quick Add</h3>
          <div className="flex gap-2 justify-center">
            {[15, 30, 60].map(v => (
              <button
                key={v}
                onClick={() => setSeconds(prev => prev + v)}
                className="px-4 py-3 rounded-2xl font-black text-sm bg-zinc-900/50 text-zinc-400 border border-white/5 hover:bg-lime-400/10 hover:text-lime-400 transition-all"
              >
                +{v}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/30 rounded-2xl p-5 text-center border border-white/5">
          <span className="material-symbols-outlined text-2xl text-lime-400 mb-2">timer</span>
          <p className="text-2xl font-black text-white">{formatTime(workoutTime)}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Total Time</p>
        </div>
        <div className="bg-zinc-900/30 rounded-2xl p-5 text-center border border-white/5">
          <span className="material-symbols-outlined text-2xl text-amber-500 mb-2">fitness_center</span>
          <p className="text-2xl font-black text-white">{Math.floor(workoutTime / 60)}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Minutes</p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-zinc-900/30 rounded-2xl p-5 border border-white/5">
        <h3 className="text-[10px] font-black text-lime-400 uppercase tracking-widest mb-3">Training Tip</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Rest 60-90 seconds between sets for strength. 30-60 seconds for hypertrophy (muscle growth). 
          Keep rest under 3 minutes to maintain workout intensity.
        </p>
      </div>
    </main>
  );
}