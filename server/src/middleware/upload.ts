import multer from 'multer';
import { config } from '../config.js';
import { buildStoredFilename, ensureUploadDir } from '../services/documents.js';
import { isAllowedUpload } from '../utils/files.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    void ensureUploadDir()
      .then(() => cb(null, config.uploadDir))
      .catch((err) => cb(err as Error, config.uploadDir));
  },
  filename: (_req, file, cb) => {
    cb(null, buildStoredFilename(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeBytes, files: 20 },
  fileFilter: (req, file, cb) => {
    if (!isAllowedUpload(file.originalname, file.mimetype)) {
      // Reject without throwing — throwing aborts the socket (ECONNRESET in tests/clients)
      (req as Express.Request & { fileFilterError?: string }).fileFilterError =
        'Only PDF, CSV, and TXT files are allowed.';
      cb(null, false);
      return;
    }
    cb(null, true);
  },
});

