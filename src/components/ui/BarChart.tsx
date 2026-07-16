export default function BarChart({
  data,
  maxWidth = 300,
}: {
  data: { label: string; value: number; color?: string }[];
  maxWidth?: number;
}) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-3" style={{ height: 140, maxWidth }}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 100, 8);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <span className="font-anton text-sm text-white">{d.value}</span>
            <div
              className="w-full rounded-lg transition-all duration-700"
              style={{ height: `${h}%`, background: d.color || 'var(--red)', minHeight: 8 }}
            />
            <span
              className="t-label truncate w-full text-center"
              style={{ color: 'var(--text-3)' }}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
