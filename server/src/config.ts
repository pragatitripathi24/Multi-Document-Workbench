import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  uploadDir: path.resolve(
    serverRoot,
    process.env.UPLOAD_DIR ?? 'uploads',
  ),
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_BYTES ?? 10 * 1024 * 1024),
  allowedMimeTypes: [
    'application/pdf',
    'text/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/csv',
  ] as const,
  allowedExtensions: ['.pdf', '.csv', '.txt'] as const,
};
