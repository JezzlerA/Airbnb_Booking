import { Router } from 'express';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { asyncHandler } from '../../utils/async-handler';
import { createHttpError } from '../../utils/http-error';
import * as paymentService from './payments.service';

export const paymongoWebhookRouter = Router();
export const xenditWebhookRouter = Router();
export const paymentRouter = Router();

paymongoWebhookRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
      throw createHttpError(400, 'validation_error', 'Webhook route requires a raw JSON body.');
    }

    const data = await paymentService.handlePaymongoWebhook(req.body, req.header('paymongo-signature') ?? undefined);
    res.json({ received: true, data });
  })
);

xenditWebhookRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
      throw createHttpError(400, 'validation_error', 'Webhook route requires a raw JSON body.');
    }

    const data = await paymentService.handleXenditWebhook(req.body, req.header('x-endline-signature') ?? undefined);
    res.json({ received: true, data });
  })
);

paymentRouter.post(
  '/checkout',
  requireAuth,
  validate(paymentService.createCheckoutSessionSchema),
  asyncHandler(async (req, res) => {
    const data = await paymentService.createCheckoutSession(
      { id: req.user!.id, email: req.user!.email },
      req.body
    );
    res.status(201).json({ data });
  })
);

paymentRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await paymentService.listPayments({
      actor: req.user!,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      page: typeof req.query.page === 'string' ? Number(req.query.page) : undefined,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined
    });
    res.json({ data: data.data, pagination: data.pagination });
  })
);

paymentRouter.get(
  '/dashboard',
  requireAuth,
  requireRoles('admin', 'host'),
  asyncHandler(async (_req, res) => {
    const data = await paymentService.getPaymentDashboard();
    res.json({ data });
  })
);

paymentRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await paymentService.getPaymentById(String(req.params.id), req.user!);
    res.json({ data });
  })
);

paymentRouter.get(
  '/:id/receipt.pdf',
  requireAuth,
  asyncHandler(async (req, res) => {
    const receipt = await paymentService.getReceiptPdf(String(req.params.id), req.user!);
    res
      .status(200)
      .set({
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${receipt.filename}"`
      })
      .send(receipt.buffer);
  })
);

paymentRouter.post(
  '/:id/refund',
  requireAuth,
  requireRoles('admin', 'host'),
  validate(paymentService.refundPaymentSchema),
  asyncHandler(async (req, res) => {
    const data = await paymentService.refundPayment(String(req.params.id), req.body, req.user!);
    res.json({ data });
  })
);
