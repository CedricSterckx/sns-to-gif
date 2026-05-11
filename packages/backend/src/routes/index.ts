import { Router } from 'express';
import mediaRoutes from './media.routes.js';
import jobsRoutes from './jobs.routes.js';
import exportRoutes from './export.routes.js';

const router = Router();

router.use('/media', mediaRoutes);
router.use('/jobs', jobsRoutes);
router.use('/export', exportRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
