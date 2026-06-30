import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { asyncHandler } from '../../utils/async-handler';
import * as reviewService from './reviews.service';

export const reviewRouter = Router();

reviewRouter.get(
  '/property/:propertyId',
  asyncHandler(async (req, res) => {
    const page = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
    const data = await reviewService.listReviews(req.params.propertyId!, page, limit);
    res.json({ data: data.data, pagination: data.pagination });
  })
);

reviewRouter.post(
  '/',
  requireAuth,
  validate(reviewService.createReviewSchema),
  asyncHandler(async (req, res) => {
    const data = await reviewService.createReview(req.user!.id, req.body);
    res.status(201).json({ data });
  })
);

reviewRouter.patch(
  '/:id/response',
  requireAuth,
  requireRoles('host', 'admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({ response: z.string().trim().max(2000) });
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }

    await reviewService.updateReviewResponse(req.params.id!, result.data.response, req.user!.id);
    res.json({ data: { success: true } });
  })
);
