import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { corsOptions } from './config/cors';
import { pool } from './config/db';
import { env } from './config/env';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { authRouter } from './modules/auth/auth.routes';
import { bookingRouter } from './modules/bookings/bookings.routes';
import { propertyRouter } from './modules/properties/properties.routes';
import { reviewRouter } from './modules/reviews/reviews.routes';
import { apiLimiter } from './middleware/rate-limit';
import { requestId } from './middleware/request-id';
import { errorHandler, notFoundHandler } from './middleware/error';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(requestId);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

app.get('/health', async (_req, res, next) => {
  try {
    await pool.query('select 1');
    res.json({
      status: 'ok',
      service: 'havenshare-api',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/analytics', analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
