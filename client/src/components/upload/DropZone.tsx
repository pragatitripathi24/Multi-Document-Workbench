import { FileUp, UploadCloud } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
    },
    [onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={[
        'card flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-14 text-center transition',
        dragging
          ? 'border-indigo bg-indigo-50/50'
          : 'border-surface-border hover:border-indigo/40 hover:bg-white',
        disabled ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo">
        {dragging ? (
          <FileUp className="h-7 w-7" />
        ) : (
          <UploadCloud className="h-7 w-7" />
        )}
      </div>
      <p className="mt-4 text-base font-semibold text-navy">
        Drag and drop documents here
      </p>
      <p className="mt-1 max-w-md text-sm text-surface-muted">
        PDF, CSV, or TXT · up to 10 MB each · multiple files supported
      </p>
      <span className="btn-primary mt-5">Browse files</span>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.csv,.txt,application/pdf,text/csv,text/plain"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
