import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { asyncHandler } from '../../utils/async-handler';
import * as bookingService from './bookings.service';

export const bookingRouter = Router();

bookingRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await bookingService.listBookings({
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      userId: typeof req.query.userId === 'string' ? req.query.userId : undefined,
      propertyId: typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined,
      page: typeof req.query.page === 'string' ? Number(req.query.page) : undefined,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined
    });

    res.json({ data: data.data, pagination: data.pagination });
  })
);

bookingRouter.post(
  '/',
  requireAuth,
  validate(bookingService.createBookingSchema),
  asyncHandler(async (req, res) => {
    const data = await bookingService.createBooking(req.user!.id, req.body);
    res.status(201).json({ data });
  })
);

bookingRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await bookingService.getBookingById(req.params.id);
    res.json({ data });
  })
);

bookingRouter.patch(
  '/:id/status',
  requireAuth,
  validate(bookingService.updateBookingStatusSchema),
  asyncHandler(async (req, res) => {
    const data = await bookingService.updateBookingStatus(req.params.id, req.body.status, req.user!);
    res.json({ data });
  })
);
