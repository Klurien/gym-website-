import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import ExerciseCard from '../components/ui/ExerciseCard';
import ExerciseForm from '../components/ui/ExerciseForm';

const DEFAULT_PROGRAMS = [
  { id: 1, title: 'Foundation Strength', level: 'beginner' },
  { id: 2, title: 'Bodyweight Mastery', level: 'beginner' },
  { id: 3, title: 'Hypertrophy Accelerator', level: 'intermediate' },
  { id: 4, title: 'Power & Explosiveness', level: 'intermediate' },
  { id: 5, title: 'Elite Performance', level: 'advanced' },
  { id: 6, title: 'Certified Coach Program', level: 'advanced' },
];

const LEVEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  beginner: { bg: 'rgba(0,210,106,0.1)', color: '#00D26A', border: 'rgba(0,210,106,0.3)' },
  intermediate: { bg: 'rgba(255,184,0,0.1)', color: '#FFB800', border: 'rgba(255,184,0,0.3)' },
  advanced: { bg: 'rgba(255,36,66,0.1)', color: '#FF2442', border: 'rgba(255,36,66,0.3)' },
};

export default function AdminExercises({
  user,
  initialProgramId,
}: {
  user: any;
  initialProgramId?: string;
}) {
  const [exercises, setExercises] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>(DEFAULT_PROGRAMS);
  const [activeProgram, setActiveProgram] = useState<string>(initialProgramId || 'all');
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/exercises', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : []))
      .then(data => { if (data?.length) setExercises(data); })
      .catch(() => {});
    fetch('/api/programs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : []))
      .then(data => { if (data?.length) setPrograms(data); })
      .catch(() => {});
  }, []);

  const isAdmin = user.role === 'admin' || user.role === 'trainer';
  const filtered =
    activeProgram === 'all'
      ? exercises
      : exercises.filter(e => String(e.program_id) === activeProgram);

  const sorted = [...filtered].sort((a, b) => {
    const progA = programs.find(p => String(p.id) === String(a.program_id));
    const progB = programs.find(p => String(p.id) === String(b.program_id));
    const levelOrder: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };
    const levelDiff =
      (levelOrder[progA?.level as string] || 0) -
      (levelOrder[progB?.level as string] || 0);
    if (levelDiff !== 0) return sortAsc ? levelDiff : -levelDiff;
    return sortAsc
      ? a.order_index - b.order_index
      : b.order_index - a.order_index;
  });

  const handleCreate = async (data: any) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newEx = { ...data, id: Date.now() };
        setExercises(prev => [...prev, newEx]);
        setCreating(false);
      }
    } catch {}
    setLoading(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editingId) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/exercises/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setExercises(prev =>
          prev.map(e => (e.id === editingId ? { ...e, ...data } : e))
        );
        setEditingId(null);
      }
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Permanently delete this exercise?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch {}
  };

  const startEdit = (exercise: any) => {
    setCreating(false);
    setEditingId(exercise.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCreating(false);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-32 space-y-6 animate-fade-in">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="t-h1 text-white">EXERCISES</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
            Manage exercises across all training programs
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); }}
            className="btn w-12 h-12 p-0 flex items-center justify-center rounded-xl"
            title="Add exercise"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        )}
      </header>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setActiveProgram('all')}
            className="px-5 py-2.5 rounded-full text-xs font-bold tracking-wider whitespace-nowrap transition-all shrink-0"
            style={
              activeProgram === 'all'
                ? { background: 'var(--red)', color: '#fff', boxShadow: 'var(--shadow-red)' }
                : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }
            }
          >
            ALL
          </button>
          {programs.map(p => {
            const cfg = LEVEL_COLORS[p.level] || LEVEL_COLORS.beginner;
            return (
              <button
                key={String(p.id)}
                onClick={() => setActiveProgram(String(p.id))}
className="px-5 py-3 rounded-full text-xs font-bold tracking-wider whitespace-nowrap transition-all shrink-0 min-h-[44px]"
                style={
                  activeProgram === String(p.id)
                    ? { background: cfg.color, color: '#000', boxShadow: `0 4px 16px ${cfg.color}40` }
                    : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }
                }
              >
                {p.title}
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-bold tracking-wider transition-all shrink-0 min-h-[44px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            {sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>SORT</span>
          </button>
        )}
      </div>

      {creating && (
        <ExerciseForm
          exercise={null}
          programs={programs}
          onSubmit={handleCreate}
          onCancel={cancelEdit}
          loading={loading}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(exercise => {
          const program = programs.find(
            p => String(p.id) === String(exercise.program_id)
          );
          const cfg = program
            ? LEVEL_COLORS[program.level]
            : LEVEL_COLORS.beginner;
          const isEditing = editingId === exercise.id;

          if (isEditing) {
            return (
              <div
                key={String(exercise.id)}
                className="rounded-[20px] overflow-hidden transition-all"
                style={{ background: 'var(--surface)', border: '2px solid var(--red)' }}
              >
                <ExerciseForm
                  exercise={exercise}
                  programs={programs}
                  onSubmit={handleUpdate}
                  onCancel={cancelEdit}
                  loading={loading}
                />
              </div>
            );
          }

          return (
            <div key={String(exercise.id)}>
              {isAdmin && (
                <div className="flex items-center justify-end gap-2 mb-2 px-1">
                  <button
                    onClick={() => startEdit(exercise)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all hover:scale-105 min-h-[44px]"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                  >
                    <Pencil size={14} /> EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(exercise.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all hover:scale-105 min-h-[44px]"
                    style={{ background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid rgba(255,36,66,0.2)' }}
                  >
                    <Trash2 size={14} /> DELETE
                  </button>
                </div>
              )}
              <ExerciseCard exercise={exercise} onEdit={startEdit} onDelete={handleDelete} />
            </div>
          );
        })}

        {isAdmin && sorted.length === 0 && !creating && (
          <div className="text-center py-16 space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'var(--surface-2)' }}
            >
              <Plus size={28} style={{ color: 'var(--text-3)' }} strokeWidth={1.5} />
            </div>
            <p className="font-anton text-2xl text-white uppercase">
              NO EXERCISES YET
            </p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Click + to create your first exercise
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
