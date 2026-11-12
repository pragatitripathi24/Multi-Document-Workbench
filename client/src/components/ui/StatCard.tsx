import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: 'indigo' | 'navy' | 'amber' | 'rose';
  hint?: string;
}

const accentStyles = {
  indigo: 'bg-indigo-50 text-indigo',
  navy: 'bg-navy-50 text-navy',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-600',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'indigo',
  hint,
}: StatCardProps) {
  return (
    <div className="card p-5 transition hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-surface-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-navy">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-surface-muted">{hint}</p>
          ) : null}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentStyles[accent]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
