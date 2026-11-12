import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  type DocumentType,
} from '../types';

export interface FileValidationError {
  fileName: string;
  message: string;
}

export function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
}

export function isAllowedExtension(fileName: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(
    getExtension(fileName),
  );
}

export function inferDocumentType(fileName: string): DocumentType | null {
  const ext = getExtension(fileName);
  if (ext === '.pdf') return 'pdf';
  if (ext === '.csv') return 'csv';
  if (ext === '.txt') return 'txt';
  return null;
}

export function validateFiles(files: File[]): {
  valid: File[];
  errors: FileValidationError[];
} {
  const valid: File[] = [];
  const errors: FileValidationError[] = [];

  for (const file of files) {
    if (!isAllowedExtension(file.name)) {
      errors.push({
        fileName: file.name,
        message: 'Only PDF, CSV, and TXT files are allowed.',
      });
      continue;
    }
    if (file.size === 0) {
      errors.push({
        fileName: file.name,
        message: 'File is empty.',
      });
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push({
        fileName: file.name,
        message: 'File exceeds the 10 MB size limit.',
      });
      continue;
    }
    valid.push(file);
  }

  return { valid, errors };
}
