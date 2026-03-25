import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { getDBStatus } from './config/database';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import ridesRoutes from './routes/rides.routes';
import requestsRoutes from './routes/requests.routes';
import notificationsRoutes from './routes/notifications.routes';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(globalLimiter);

  // Body parsing
  app.use(express.json());

  // Health check (no auth)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', db: getDBStatus(), env: env.NODE_ENV });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/rides', ridesRoutes);
  app.use('/api/requests', requestsRoutes);
  app.use('/api/notifications', notificationsRoutes);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
