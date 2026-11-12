import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadDocuments } from '../api/client';
import { DropZone } from '../components/upload/DropZone';
import { FileTypeBadge } from '../components/ui/Badge';
import { ToastStack } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { formatBytes } from '../lib/format';
import { inferDocumentType, validateFiles } from '../lib/validation';
import type { DocumentRecord } from '../types';

interface QueuedFile {
  id: string;
  file: File;
  type: string;
}

export function UploadPage() {
  const toast = useToast();
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<DocumentRecord[]>([]);

  const addFiles = (files: File[]) => {
    const { valid, errors } = validateFiles(files);
    for (const err of errors) {
      toast.error(err.fileName, err.message);
    }
    if (valid.length === 0) return;

    const next: QueuedFile[] = valid.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      type: inferDocumentType(file.name) ?? 'txt',
    }));
    setQueue((prev) => {
      const names = new Set(prev.map((q) => q.file.name + q.file.size));
      const deduped = next.filter(
        (q) => !names.has(q.file.name + q.file.size),
      );
      return [...prev, ...deduped];
    });
    toast.success(
      `${valid.length} file${valid.length === 1 ? '' : 's'} added`,
      'Ready to upload',
    );
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpload = async () => {
    if (queue.length === 0) {
      toast.error('No files selected', 'Add PDF, CSV, or TXT files first.');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadDocuments(queue.map((q) => q.file));
      setUploaded((prev) => [...result.data, ...prev]);
      setQueue([]);
      toast.success(
        `Uploaded ${result.data.length} file${result.data.length === 1 ? '' : 's'}`,
        result.source === 'mock'
          ? 'Stored in session (API offline). Backend upload lands in Phase 2.'
          : 'Documents are being processed.',
      );
    } catch {
      toast.error('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Upload documents
        </h1>
        <p className="mt-1 text-sm text-surface-muted">
          Multi-document drag-and-drop with PDF, CSV, and TXT validation
        </p>
      </div>

      <DropZone onFiles={addFiles} disabled={uploading} />

      {queue.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Upload queue ({queue.length})
            </h2>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void handleUpload()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload all'}
            </button>
          </div>
          <ul className="divide-y divide-surface-border">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {item.file.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <FileTypeBadge type={item.type} />
                    <span className="text-xs text-surface-muted">
                      {formatBytes(item.file.size)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-2 text-surface-muted hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => removeFromQueue(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {uploaded.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Uploaded this session
            </h2>
            <Link to="/analyze" className="text-xs font-medium text-indigo hover:underline">
              Analyze documents →
            </Link>
          </div>
          <ul className="divide-y divide-surface-border">
            {uploaded.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start gap-3 px-5 py-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {doc.originalName}
                  </p>
                  <p className="mt-0.5 text-xs text-surface-muted">
                    {formatBytes(doc.sizeBytes)} · {doc.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex items-start gap-3 rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm text-surface-muted">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo" />
        <p>
          Invalid types, empty files, and files over 10 MB are rejected with
          clear errors. Secure server-side storage and extraction arrive in
          Phase 2–3.
        </p>
      </div>

      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
