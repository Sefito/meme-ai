import { clsx } from 'clsx';

export default function ProgressBar({ value }: { value?: number }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="w-full h-2 bg-neutral-800 rounded">
      <div className={clsx('h-2 rounded bg-white transition-all')} style={{ width: `${v}%` }} />
    </div>
  );
}