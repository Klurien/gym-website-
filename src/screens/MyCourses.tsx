import { useState, useEffect } from 'react';
import { BookOpen, Clock, BarChart3, ChevronDown, ChevronUp, Dumbbell, CheckCircle } from 'lucide-react';

const DEMO_EXERCISES = [
  { id: 1, program_id: 1, name: 'Barbell Squat', description: 'Compound leg movement', sets: 4, reps: '8-10', rest_seconds: 120, order_index: 1 },
  { id: 2, program_id: 1, name: 'Bench Press', description: 'Upper body pushing strength', sets: 4, reps: '8-10', rest_seconds: 120, order_index: 2 },
  { id: 3, program_id: 1, name: 'Bent Over Row', description: 'Back thickness and width', sets: 4, reps: '8-10', rest_seconds: 90, order_index: 3 },
  { id: 4, program_id: 1, name: 'Overhead Press', description: 'Shoulder strength and stability', sets: 3, reps: '8-12', rest_seconds: 90, order_index: 4 },
  { id: 5, program_id: 1, name: 'Deadlift', description: 'Full body posterior chain', sets: 3, reps: '6-8', rest_seconds: 180, order_index: 5 },
  { id: 6, program_id: 2, name: 'Push-up', description: 'Chest, shoulders, triceps', sets: 3, reps: '10-15', rest_seconds: 60, order_index: 1 },
  { id: 7, program_id: 2, name: 'Pull-up', description: 'Back and biceps', sets: 3, reps: '5-10', rest_seconds: 90, order_index: 2 },
  { id: 8, program_id: 2, name: 'Air Squat', description: 'Leg endurance', sets: 4, reps: '15-20', rest_seconds: 60, order_index: 3 },
  { id: 9, program_id: 2, name: 'Plank', description: 'Core stability', sets: 3, reps: '30-60s', rest_seconds: 60, order_index: 4 },
  { id: 10, program_id: 2, name: 'Lunge', description: 'Unilateral leg strength', sets: 3, reps: '12-15', rest_seconds: 60, order_index: 5 },
];

const DEMO_PROGRAMS = [
  { id: 1, title: 'Foundation Strength', description: 'Build your core foundation with compound movements.', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop' },
  { id: 2, title: 'Bodyweight Mastery', description: 'Master pushups, pullups, and bodyweight fundamentals.', level: 'beginner', duration: '6 weeks', sessions: 18, price: 0, image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop' },
  { id: 3, title: 'Hypertrophy Accelerator', description: 'Progressive overload programming for lean muscle growth.', level: 'intermediate', duration: '8 weeks', sessions: 24, price: 29, image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop' },
  { id: 4, title: 'Power & Explosiveness', description: 'Olympic lifts and plyometrics for explosive athletic performance.', level: 'intermediate', duration: '6 weeks', sessions: 18, price: 39, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop' },
  { id: 5, title: 'Elite Performance', description: 'Advanced periodization for experienced lifters.', level: 'advanced', duration: '12 weeks', sessions: 36, price: 79, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop' },
  { id: 6, title: 'Certified Coach Program', description: 'Become a certified trainer under expert mentorship.', level: 'advanced', duration: '16 weeks', sessions: 48, price: 149, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop' },
];

const levelColors: Record<string, { color: string; bg: string }> = {
  beginner: { color: '#00D26A', bg: 'rgba(0,210,106,0.1)' },
  intermediate: { color: '#FFB800', bg: 'rgba(255,184,0,0.1)' },
  advanced: { color: '#FF2442', bg: 'rgba(255,36,66,0.1)' },
};

function ExerciseItem({ exercise }: { exercise: any; key?: string }) {
  const formatRest = (seconds: number) => {
    if (seconds >= 60) return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    return `${seconds}s`;
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--red-soft)' }}
      >
        <Dumbbell size={18} style={{ color: 'var(--red)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{exercise.name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{exercise.description}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: 'var(--text-3)' }}>
          <span>{exercise.sets} sets</span>
          <span>{exercise.reps} reps</span>
          <span>{formatRest(exercise.rest_seconds)} rest</span>
        </div>
      </div>
      <button
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--green-soft)' }}
        title="Mark as complete"
      >
        <CheckCircle size={20} style={{ color: 'var(--green)' }} />
      </button>
    </div>
  );
}

function ProgramCourse({ program, exercises }: { program: any; exercises: any[]; key?: string }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = levelColors[program.level] || levelColors.beginner;

  return (
    <div
      className="rounded-[20px] overflow-hidden transition-all"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="relative h-32 overflow-hidden">
        <img src={program.image} className="w-full h-full object-cover" alt={program.title} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }} />
        <div className="absolute top-3 right-3">
          <span className="badge" style={{ background: cfg.color, color: '#000' }}>{program.level}</span>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <h3 className="font-anton text-xl text-white uppercase">{program.title}</h3>
          <span className="badge" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            <CheckCircle size={12} /> ENROLLED
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>{program.description}</p>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
          <span className="flex items-center gap-1.5"><Clock size={13} /> {program.duration}</span>
          <span className="flex items-center gap-1.5"><BarChart3 size={13} /> {program.sessions} sessions</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full py-3.5 px-5 rounded-xl text-xs font-bold tracking-wider transition-all min-h-[48px]"
          style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
        >
          <span>{exercises.length} EXERCISES</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded && (
          <div className="space-y-2 animate-fade-in">
            {exercises.map(ex => (
              <ExerciseItem key={ex.id} exercise={ex} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyCourses({ user, selectedProgramId }: { user: any; selectedProgramId?: string }) {
  const [exercises, setExercises] = useState<any[]>(DEMO_EXERCISES);
  const [programs, setPrograms] = useState<any[]>(DEMO_PROGRAMS);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/exercises', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (data?.length) setExercises(data); })
      .catch(() => {});
    fetch('/api/programs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (data?.length) setPrograms(data); })
      .catch(() => {});
  }, []);

  const unlocked = programs.filter(p => p.price === 0 || user.premium);

  const displayPrograms = selectedProgramId
    ? unlocked.filter(p => String(p.id) === selectedProgramId)
    : unlocked;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-32 space-y-6 animate-fade-in">
      <header>
        <h1 className="t-h1 text-white">MY COURSES</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
          {selectedProgramId ? 'Course workouts' : `${unlocked.length} enrolled program${unlocked.length !== 1 ? 's' : ''}`}
        </p>
      </header>

      {displayPrograms.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'var(--surface-2)' }}
          >
            <BookOpen size={28} style={{ color: 'var(--text-3)' }} strokeWidth={1.5} />
          </div>
          <p className="font-anton text-2xl text-white uppercase">NO COURSES YET</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Browse programs to purchase your first course
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayPrograms.map(program => {
            const progExercises = exercises.filter(e => String(e.program_id) === String(program.id));
            return <ProgramCourse key={String(program.id)} program={program} exercises={progExercises} />;
          })}
        </div>
      )}
    </div>
  );
}
