import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import * as analyticsService from './analytics.service';

export const analyticsRouter = Router();

analyticsRouter.get(
  '/summary',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const data = await analyticsService.getAnalyticsSummary();
    res.json({ data });
  })
);
