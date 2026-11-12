import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { analysesRouter } from './routes/analyses.js';
import { documentsRouter } from './routes/documents.js';
import { statsRouter } from './routes/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  const allowedOrigins = new Set(
    [
      config.clientOrigin,
      process.env.RENDER_EXTERNAL_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ].filter(Boolean) as string[],
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin browser requests and non-browser tools send no Origin
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'documind-api' });
  });

  app.use('/api/documents', documentsRouter);
  app.use('/api/analyses', analysesRouter);
  app.use('/api/stats', statsRouter);

  // Production: serve Vite build from the same Render Web Service
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use(errorHandler);
  return app;
}
