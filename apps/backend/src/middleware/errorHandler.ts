import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err.message, err.stack);

  res.status(500).json({
    error: 'Internal server error',
    ...(env.NODE_ENV === 'development' && { message: err.message }),
  });
}
