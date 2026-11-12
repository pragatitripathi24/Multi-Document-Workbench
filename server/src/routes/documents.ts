import { Router } from 'express';
import {
  getDocument,
  listDocuments,
  processUploadedFile,
} from '../services/documents.js';
import { upload } from '../middleware/upload.js';

export const documentsRouter = Router();

documentsRouter.get('/', async (_req, res, next) => {
  try {
    const docs = await listDocuments();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

documentsRouter.get('/:id', async (req, res, next) => {
  try {
    const doc = await getDocument(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Document not found', code: 'NOT_FOUND' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

documentsRouter.post('/upload', upload.array('files', 20), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      const filterError = (
        req as Express.Request & { fileFilterError?: string }
      ).fileFilterError;
      res.status(400).json({
        message:
          filterError ??
          'No files uploaded. Use form field "files".',
        code: filterError ? 'INVALID_FILE_TYPE' : 'NO_FILES',
      });
      return;
    }

    const results = [];
    for (const file of files) {
      results.push(await processUploadedFile(file));
    }
    res.status(201).json(results);
  } catch (err) {
    next(err);
  }
});
