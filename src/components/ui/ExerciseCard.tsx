import { Trash2, Pencil, Video, Image } from 'lucide-react';

interface Exercise {
  id: number | string;
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

export default function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  onEdit?: (ex: Exercise) => void;
  onDelete?: (id: number | string) => void;
}) {
  const formatRest = (seconds: number) => {
    if (seconds >= 60) {
      return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <div
      className="rounded-xl transition-all hover:scale-[1.01]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
                #{exercise.order_index}
              </span>
              <h4 className="font-semibold text-white truncate">{exercise.name}</h4>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              {exercise.description}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {exercise.video_url && (
              <Video size={16} style={{ color: 'var(--text-3)' }} />
            )}
            {exercise.image_url && (
              <Image size={16} style={{ color: 'var(--text-3)' }} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--red)' }}
            />
            {exercise.sets} sets
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded"
              style={{ background: 'var(--amber)' }}
            />
            {exercise.reps} reps
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded"
              style={{ background: 'var(--green)' }}
            />
            {formatRest(exercise.rest_seconds)} rest
          </span>
        </div>

        {(onEdit || onDelete) && (
          <div
            className="flex items-center justify-end gap-2 pt-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {onEdit && (
              <button
                onClick={() => onEdit(exercise)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all hover:scale-105 min-h-[44px]"
                style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                <Pencil size={14} /> EDIT
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(exercise.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all hover:scale-105 min-h-[44px]"
                style={{ background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid rgba(255,36,66,0.2)' }}
              >
                <Trash2 size={14} /> DELETE
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
