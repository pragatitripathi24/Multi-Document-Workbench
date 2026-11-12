import { useCallback, useState } from 'react';
import type { ToastKind, ToastMessage } from '../components/ui/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, kind, title, description }]);
    },
    [],
  );

  return {
    toasts,
    dismiss,
    success: (title: string, description?: string) =>
      push('success', title, description),
    error: (title: string, description?: string) =>
      push('error', title, description),
    info: (title: string, description?: string) =>
      push('info', title, description),
  };
}
