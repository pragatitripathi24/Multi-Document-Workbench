export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-surface-muted">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo border-t-transparent" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
