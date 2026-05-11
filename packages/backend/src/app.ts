import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { getOutputDir } from './utils/temp.js';
import apiRoutes from './routes/index.js';
import { AppError } from './utils/errors.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Serve generated GIFs statically
  app.use('/output', express.static(getOutputDir()));

  app.use('/api', apiRoutes);

  // In production, serve frontend build
  // __dirname = packages/backend/dist → ../../frontend/dist = packages/frontend/dist
  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    // SPA fallback: return index.html for any non-API route
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
      });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  return app;
}
