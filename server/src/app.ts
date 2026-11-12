import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { analysesRouter } from './routes/analyses.js';
import { documentsRouter } from './routes/documents.js';
import { statsRouter } from './routes/stats.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [
        config.clientOrigin,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'documind-api' });
  });

  app.use('/api/documents', documentsRouter);
  app.use('/api/analyses', analysesRouter);
  app.use('/api/stats', statsRouter);

  app.use(errorHandler);
  return app;
}
