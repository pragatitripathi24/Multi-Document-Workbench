import { Router } from 'express';
import {
  createAnalysis,
  getAnalysis,
  listAnalyses,
} from '../services/analyses.js';
import { createAnalysisSchema } from '../validation.js';

export const analysesRouter = Router();

analysesRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await listAnalyses();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

analysesRouter.get('/:id', async (req, res, next) => {
  try {
    const row = await getAnalysis(req.params.id);
    if (!row) {
      res.status(404).json({ message: 'Analysis not found', code: 'NOT_FOUND' });
      return;
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
});

analysesRouter.post('/', async (req, res, next) => {
  try {
    const payload = createAnalysisSchema.parse(req.body);
    const result = await createAnalysis(payload);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});
