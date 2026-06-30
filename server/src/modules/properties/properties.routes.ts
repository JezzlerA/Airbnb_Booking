import { Router } from 'express';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { asyncHandler } from '../../utils/async-handler';
import * as propertyService from './properties.service';

export const propertyRouter = Router();

propertyRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await propertyService.listProperties({
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      city: typeof req.query.city === 'string' ? req.query.city : undefined,
      minPrice: typeof req.query.minPrice === 'string' ? Number(req.query.minPrice) : undefined,
      maxPrice: typeof req.query.maxPrice === 'string' ? Number(req.query.maxPrice) : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      page: typeof req.query.page === 'string' ? Number(req.query.page) : undefined,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined
    });

    res.json({ data: data.data, pagination: data.pagination });
  })
);

propertyRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await propertyService.getPropertyById(req.params.id!);
    res.json({ data });
  })
);

propertyRouter.post(
  '/',
  requireAuth,
  requireRoles('host', 'admin'),
  validate(propertyService.createPropertySchema),
  asyncHandler(async (req, res) => {
    const data = await propertyService.createProperty(req.user!.id, req.body);
    res.status(201).json({ data });
  })
);

propertyRouter.patch(
  '/:id',
  requireAuth,
  requireRoles('host', 'admin'),
  validate(propertyService.updatePropertySchema),
  asyncHandler(async (req, res) => {
    const data = await propertyService.updateProperty(req.params.id!, req.body, req.body.images);
    res.json({ data });
  })
);

propertyRouter.delete(
  '/:id',
  requireAuth,
  requireRoles('host', 'admin'),
  asyncHandler(async (req, res) => {
    const data = await propertyService.archiveProperty(req.params.id!);
    res.json({ data });
  })
);
