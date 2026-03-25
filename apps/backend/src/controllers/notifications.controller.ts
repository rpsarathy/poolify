import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as NotificationService from '../services/notification.service';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await NotificationService.getNotifications(req.user!.sub, page, limit);
  res.json(result);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await NotificationService.markRead(req.params.id, req.user!.sub);
  res.status(204).send();
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await NotificationService.markAllRead(req.user!.sub);
  res.status(204).send();
});
