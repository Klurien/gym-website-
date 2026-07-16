import { useState, useEffect, type ReactNode } from 'react';
import { Pencil, Trash2, Save, X, Plus, ListTodo } from 'lucide-react';
import ProgramCard from '../components/ui/ProgramCard';

const DEFAULT_PROGRAMS = [
  { id: 1, title: 'Foundation Strength', description: 'Build your core foundation with compound movements. Perfect for first-timers.', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop' },
  { id: 2, title: 'Bodyweight Mastery', description: 'Master pushups, pullups, and bodyweight fundamentals anywhere.', level: 'beginner', duration: '6 weeks', sessions: 18, price: 0, image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop' },
  { id: 3, title: 'Hypertrophy Accelerator', description: 'Progressive overload programming for lean muscle growth.', level: 'intermediate', duration: '8 weeks', sessions: 24, price: 29, image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop' },
  { id: 4, title: 'Power & Explosiveness', description: 'Olympic lifts and plyometrics for explosive athletic performance.', level: 'intermediate', duration: '6 weeks', sessions: 18, price: 39, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop' },
  { id: 5, title: 'Elite Performance', description: 'Advanced periodization for experienced lifters chasing peak results.', level: 'advanced', duration: '12 weeks', sessions: 36, price: 79, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop' },
  { id: 6, title: 'Certified Coach Program', description: 'Become a certified trainer under expert mentorship.', level: 'advanced', duration: '16 weeks', sessions: 48, price: 149, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop' },
];

interface Program {
  id: number | string;
  title: string;
  description: string;
  level: string;
  duration: string;
  sessions: number;
  price: number;
  image: string;
}

const LEVELS = [
  { key: 'all', label: 'ALL' },
  { key: 'beginner', label: 'BEGINNER' },
  { key: 'intermediate', label: 'INTERMEDIATE' },
  { key: 'advanced', label: 'ADVANCED' },
];

export default function Programs({
  user,
  onShowPayment,
  onShowExercises,
  onStartCourse,
}: {
  user: any;
  onShowPayment: (amount: number, programId?: string, name?: string) => void;
  onShowExercises?: (programId: number | string) => void;
  onStartCourse?: (programId: number | string) => void;
}) {
  const [programs, setPrograms] = useState<Program[]>(DEFAULT_PROGRAMS);
  const [activeLevel, setActiveLevel] = useState('all');
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Program>>({});
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<Program>>({
    title: '', description: '', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: '',
  });

  const isAdmin = user.role === 'admin' || user.role === 'trainer';
  const maxId = Math.max(...programs.map(p => Number(p.id)), 0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/programs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.length) setPrograms(data); })
      .catch(() => {});
  }, []);

  const filtered = activeLevel === 'all' ? programs : programs.filter(p => p.level === activeLevel);

  const startEdit = (program: Program) => {
    setCreating(false);
    setEditingId(program.id);
    setEditForm({ ...program });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (program: Program) => {
    const token = localStorage.getItem('token');
    const body: Record<string, unknown> = {};
    if (editForm.title !== undefined && editForm.title !== program.title) body.title = editForm.title;
    if (editForm.description !== undefined && editForm.description !== program.description) body.description = editForm.description;
    if (editForm.price !== undefined && editForm.price !== program.price) body.price = editForm.price;
    if (editForm.duration !== undefined && editForm.duration !== program.duration) body.duration = editForm.duration;
    if (editForm.sessions !== undefined && editForm.sessions !== program.sessions) body.sessions = editForm.sessions;
    if (editForm.level !== undefined && editForm.level !== program.level) body.level = editForm.level;
    if (editForm.image !== undefined && editForm.image !== program.image) body.image = editForm.image;

    if (Object.keys(body).length > 0) {
      try {
        await fetch(`/api/programs/${program.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } catch {}
    }

    setPrograms(prev => prev.map(p => (p.id === program.id ? ({ ...p, ...editForm } as Program) : p)));
    setEditingId(null);
    setEditForm({});
  };

  const deleteProgram = async (id: number | string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setPrograms(prev => prev.filter(p => p.id !== id));
  };

  const createProgram = async () => {
    if (!createForm.title) return;
    const token = localStorage.getItem('token');
    const newId = maxId + 1;
    const program: Program = {
      id: newId,
      title: createForm.title || 'New Program',
      description: createForm.description || '',
      level: createForm.level || 'beginner',
      duration: createForm.duration || '4 weeks',
      sessions: createForm.sessions || 12,
      price: createForm.price ?? 0,
      image: createForm.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
    };

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(program),
      });
      const data = await res.json();
      if (data.id) program.id = data.id;
    } catch {}

    setPrograms(prev => [...prev, program]);
    setCreating(false);
    setCreateForm({ title: '', description: '', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: '' });
  };

  const FormField = ({ label, children }: { label: string; children: ReactNode }) => (
    <div>
      <label className="t-label block mb-1.5" style={{ color: 'var(--text-3)' }}>
        {label}
      </label>
      {children}
    </div>
  );

  const EditForm = ({ program, onSave, onCancel }: { program: Program; onSave: () => void | Promise<void>; onCancel: () => void; key?: string }) => (
    <div
      className="rounded-[20px] overflow-hidden transition-all"
      style={{ background: 'var(--surface)', border: '2px solid var(--red)' }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="badge" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
            <Pencil size={12} /> EDITING
          </span>
          <div className="flex gap-2">
            <button onClick={onSave} className="btn py-3 px-5 text-xs">
              <Save size={14} /> SAVE
            </button>
            <button onClick={onCancel} className="btn-outline py-3 px-5 text-xs">
              <X size={14} /> CANCEL
            </button>
          </div>
        </div>
        <FormField label="TITLE">
          <input
            className="field"
            value={editForm.title || ''}
            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Program title"
          />
        </FormField>
        <FormField label="DESCRIPTION">
          <textarea
            className="field"
            rows={2}
            value={editForm.description || ''}
            onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Program description"
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="PRICE (KES)">
            <input
              className="field"
              type="number"
              min={0}
              value={editForm.price ?? 0}
              onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
            />
          </FormField>
          <FormField label="DURATION">
            <input
              className="field"
              value={editForm.duration || ''}
              onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 4 weeks"
            />
          </FormField>
          <FormField label="SESSIONS">
            <input
              className="field"
              type="number"
              min={0}
              value={editForm.sessions ?? 0}
              onChange={e => setEditForm(f => ({ ...f, sessions: Number(e.target.value) }))}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="LEVEL">
            <select
              className="field"
              value={editForm.level || 'beginner'}
              onChange={e => setEditForm(f => ({ ...f, level: e.target.value }))}
            >
              <option value="beginner">BEGINNER</option>
              <option value="intermediate">INTERMEDIATE</option>
              <option value="advanced">ADVANCED</option>
            </select>
          </FormField>
          <FormField label="IMAGE URL">
            <input
              className="field"
              value={editForm.image || ''}
              onChange={e => setEditForm(f => ({ ...f, image: e.target.value }))}
              placeholder="https://..."
            />
          </FormField>
        </div>
      </div>
    </div>
  );

  const CreateForm = () => (
    <div
      className="rounded-[20px] overflow-hidden transition-all"
      style={{ background: 'var(--surface)', border: '2px solid var(--green)' }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="badge" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            <Plus size={12} /> NEW PROGRAM
          </span>
          <div className="flex gap-2">
            <button onClick={createProgram} className="btn py-3 px-5 text-xs">
              <Save size={14} /> CREATE
            </button>
            <button onClick={() => setCreating(false)} className="btn-outline py-3 px-5 text-xs">
              <X size={14} /> CANCEL
            </button>
          </div>
        </div>
        <FormField label="TITLE">
          <input
            className="field"
            value={createForm.title || ''}
            onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Program title"
          />
        </FormField>
        <FormField label="DESCRIPTION">
          <textarea
            className="field"
            rows={2}
            value={createForm.description || ''}
            onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Program description"
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="PRICE (KES)">
            <input
              className="field"
              type="number"
              min={0}
              value={createForm.price ?? 0}
              onChange={e => setCreateForm(f => ({ ...f, price: Number(e.target.value) }))}
            />
          </FormField>
          <FormField label="DURATION">
            <input
              className="field"
              value={createForm.duration || ''}
              onChange={e => setCreateForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 4 weeks"
            />
          </FormField>
          <FormField label="SESSIONS">
            <input
              className="field"
              type="number"
              min={0}
              value={createForm.sessions ?? 0}
              onChange={e => setCreateForm(f => ({ ...f, sessions: Number(e.target.value) }))}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="LEVEL">
            <select
              className="field"
              value={createForm.level}
              onChange={e => setCreateForm(f => ({ ...f, level: e.target.value }))}
            >
              <option value="beginner">BEGINNER</option>
              <option value="intermediate">INTERMEDIATE</option>
              <option value="advanced">ADVANCED</option>
            </select>
          </FormField>
          <FormField label="IMAGE URL">
            <input
              className="field"
              value={createForm.image || ''}
              onChange={e => setCreateForm(f => ({ ...f, image: e.target.value }))}
              placeholder="https://..."
            />
          </FormField>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-32 space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="t-h1 text-white">PROGRAMS</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
            {isAdmin ? 'Manage training plans and pricing' : 'Training plans designed by your coach'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); }}
            className="btn w-12 h-12 p-0 flex items-center justify-center rounded-xl"
            title="Add program"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        )}
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {LEVELS.map(l => (
          <button
            key={l.key}
            onClick={() => setActiveLevel(l.key)}
            className="px-5 py-3 rounded-full text-xs font-bold tracking-wider whitespace-nowrap transition-all shrink-0 min-h-[44px]"
            style={
              activeLevel === l.key
                ? { background: 'var(--red)', color: '#fff', boxShadow: 'var(--shadow-red)' }
                : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }
            }
          >
            {l.label}
          </button>
        ))}
      </div>

      {creating && <CreateForm />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(program => {
          const isUnlocked = program.price === 0 || user.premium || isAdmin;
          const isEditing = editingId === program.id;

          if (isEditing) {
            return (
              <EditForm
                key={String(program.id)}
                program={program}
                onSave={() => saveEdit(program)}
                onCancel={cancelEdit}
              />
            );
          }

          return (
            <div key={String(program.id)}>
              {isAdmin && (
                <div className="flex flex-wrap items-center justify-end gap-2 mb-2 px-1">
                  <button
                    onClick={() => startEdit(program)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all hover:scale-105 min-h-[44px]"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                  >
                    <Pencil size={14} /> EDIT
                  </button>
                  <button
                    onClick={() => onShowExercises?.(program.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all hover:scale-105 min-h-[44px]"
                    style={{ background: 'var(--amber-soft)', color: 'var(--amber)', border: '1px solid rgba(255,184,0,0.2)' }}
                  >
                    <ListTodo size={14} /> EXERCISES
                  </button>
                  <button
                    onClick={() => { if (confirm('Permanently delete this program?')) deleteProgram(program.id); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all hover:scale-105 min-h-[44px]"
                    style={{ background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid rgba(255,36,66,0.2)' }}
                  >
                    <Trash2 size={14} /> DELETE
                  </button>
                </div>
              )}
              <ProgramCard
                program={program}
                isUnlocked={isUnlocked}
                onUnlock={() => onShowPayment(program.price, String(program.id), program.title)}
                onStart={() => isAdmin ? onShowExercises?.(program.id) : onStartCourse?.(program.id)}
              />
            </div>
          );
        })}
      </div>

      {isAdmin && filtered.length === 0 && !creating && (
        <div className="text-center py-16 space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'var(--surface-2)' }}
          >
            <Plus size={28} style={{ color: 'var(--text-3)' }} strokeWidth={1.5} />
          </div>
          <p className="font-anton text-2xl text-white uppercase">NO PROGRAMS YET</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Click + to create your first training program
          </p>
        </div>
      )}
    </div>
  );
}
