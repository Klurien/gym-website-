import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { Save, X, Video, Image } from 'lucide-react';

interface ExerciseData {
  id?: number | string;
  program_id: number | string;
  name: string;
  description: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  order_index: number;
  video_url: string;
  image_url: string;
}

export default function ExerciseForm({
  exercise,
  programs,
  onSubmit,
  onCancel,
  loading,
}: {
  exercise?: ExerciseData | null;
  programs: Array<{ id: number | string; title: string }>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState({
    program_id: '',
    name: '',
    description: '',
    sets: 3,
    reps: '10',
    rest_seconds: 60,
    order_index: 0,
    video_url: '',
    image_url: '',
  });

  useEffect(() => {
    if (exercise) {
      setForm({
        program_id: String(exercise.program_id),
        name: exercise.name,
        description: exercise.description || '',
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.rest_seconds,
        order_index: exercise.order_index,
        video_url: exercise.video_url || '',
        image_url: exercise.image_url || '',
      });
    } else {
      setForm({
        program_id: programs[0] ? String(programs[0].id) : '',
        name: '',
        description: '',
        sets: 3,
        reps: '10',
        rest_seconds: 60,
        order_index: 0,
        video_url: '',
        image_url: '',
      });
    }
  }, [exercise, programs]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const FormField = ({
    label,
    children,
  }: {
    label: string;
    children: ReactNode;
  }) => (
    <div>
      <label className="t-label block mb-1.5" style={{ color: 'var(--text-3)' }}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div
      className="rounded-[20px] overflow-hidden transition-all"
      style={{ background: 'var(--surface)', border: '2px solid var(--green)' }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="badge" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            {exercise ? 'EDITING EXERCISE' : 'NEW EXERCISE'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="btn py-3 px-5 text-xs"
              disabled={loading}
            >
              <Save size={14} /> {loading ? 'SAVING...' : 'SAVE'}
            </button>
            <button onClick={onCancel} className="btn-outline py-3 px-5 text-xs">
              <X size={14} /> CANCEL
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="PROGRAM">
            <select
              className="field"
              value={form.program_id}
              onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))}
              required
            >
              <option value="">SELECT PROGRAM</option>
              {programs.map(p => (
                <option key={String(p.id)} value={String(p.id)}>
                  {p.title}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="EXERCISE NAME">
            <input
              className="field"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Barbell Bench Press"
              required
            />
          </FormField>

          <FormField label="DESCRIPTION">
            <textarea
              className="field"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description or coaching cues"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="SETS">
              <input
                className="field"
                type="number"
                min={1}
                max={10}
                value={form.sets}
                onChange={e => setForm(f => ({ ...f, sets: Number(e.target.value) }))}
              />
            </FormField>
            <FormField label="REPS">
              <input
                className="field"
                value={form.reps}
                onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
                placeholder="e.g. 8-12"
              />
            </FormField>
            <FormField label="REST (SEC)">
              <input
                className="field"
                type="number"
                min={15}
                max={300}
                value={form.rest_seconds}
                onChange={e => setForm(f => ({ ...f, rest_seconds: Number(e.target.value) }))}
              />
            </FormField>
          </div>

          <FormField label="ORDER INDEX">
            <input
              className="field"
              type="number"
              min={0}
              value={form.order_index}
              onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="VIDEO URL">
              <div className="relative">
                <Video
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  size={14}
                  style={{ color: 'var(--text-3)' }}
                />
                <input
                  className="field pl-10"
                  value={form.video_url}
                  onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </FormField>
            <FormField label="IMAGE URL">
              <div className="relative">
                <Image
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  size={14}
                  style={{ color: 'var(--text-3)' }}
                />
                <input
                  className="field pl-10"
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </FormField>
          </div>
        </form>
      </div>
    </div>
  );
}
