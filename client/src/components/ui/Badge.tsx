import type { DocumentStatus, FindingKind } from '../../types';

const statusStyles: Record<DocumentStatus, string> = {
  ready: 'bg-emerald-50 text-emerald-700',
  processing: 'bg-amber-50 text-amber-700',
  pending: 'bg-slate-100 text-slate-600',
  error: 'bg-rose-50 text-rose-700',
};

const findingStyles: Record<FindingKind, string> = {
  conflict: 'bg-rose-50 text-rose-700',
  missing_info: 'bg-amber-50 text-amber-700',
  match: 'bg-emerald-50 text-emerald-700',
  insight: 'bg-indigo-50 text-indigo',
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`badge capitalize ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

export function FindingBadge({ kind }: { kind: FindingKind }) {
  const label =
    kind === 'missing_info'
      ? 'Missing info'
      : kind.charAt(0).toUpperCase() + kind.slice(1);
  return <span className={`badge ${findingStyles[kind]}`}>{label}</span>;
}

export function FileTypeBadge({ type }: { type: string }) {
  return (
    <span className="badge bg-navy-50 uppercase text-navy">{type}</span>
  );
}
