import { Router } from 'express';
import { getStats } from '../services/analyses.js';

export const statsRouter = Router();

statsRouter.get('/', async (_req, res, next) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});
