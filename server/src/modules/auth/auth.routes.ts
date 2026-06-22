import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rate-limit';
import * as authService from '../../services/auth.service';

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate(authService.registerUserSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.registerUser(req.body);
    res.status(201).json({ data });
  })
);

authRouter.post(
  '/register-admin',
  authLimiter,
  validate(authService.registerAdminSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.registerAdmin(req.body);
    res.status(201).json({ data });
  })
);

authRouter.post(
  '/login',
  authLimiter,
  validate(authService.loginSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.loginUser(req.body);
    res.json({ data });
  })
);

authRouter.post(
  '/refresh',
  authLimiter,
  validate(authService.refreshSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.refreshTokens(req.body.refreshToken);
    res.json({ data });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await authService.getMe(req.user!.id);
    res.json({ data });
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  validate(authService.logoutSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.logout(req.body.refreshToken);
    res.json({ data });
  })
);
