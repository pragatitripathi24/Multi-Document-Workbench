import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), 4500);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = toast.kind === 'success' ? CheckCircle2 : AlertCircle;
  const color =
    toast.kind === 'success'
      ? 'text-emerald-600'
      : toast.kind === 'error'
        ? 'text-rose-600'
        : 'text-indigo';

  return (
    <div className="pointer-events-auto card flex items-start gap-3 p-4 shadow-elevated">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm text-surface-muted">
            {toast.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-surface-muted hover:bg-surface hover:text-navy"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
