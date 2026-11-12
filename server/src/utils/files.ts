import path from 'node:path';
import type { DocumentType } from '../types.js';
import { config } from '../config.js';

export function getExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function inferFileType(fileName: string, mimeType: string): DocumentType | null {
  const ext = getExtension(fileName);
  if (ext === '.pdf' || mimeType === 'application/pdf') return 'pdf';
  if (
    ext === '.csv' ||
    mimeType === 'text/csv' ||
    mimeType === 'application/csv' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return 'csv';
  }
  if (ext === '.txt' || mimeType === 'text/plain') return 'txt';
  return null;
}

export function isAllowedUpload(fileName: string, mimeType: string): boolean {
  const ext = getExtension(fileName);
  const extOk = (config.allowedExtensions as readonly string[]).includes(ext);
  const mimeOk =
    !mimeType ||
    mimeType === 'application/octet-stream' ||
    (config.allowedMimeTypes as readonly string[]).includes(mimeType);
  return extOk && mimeOk;
}
