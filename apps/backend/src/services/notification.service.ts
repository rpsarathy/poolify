import mongoose from 'mongoose';
import { NotificationModel, NotificationType } from '../models/Notification.model';
import { ConnectionRegistry } from '../realtime/ConnectionRegistry';
import { WS_EVENTS } from '../realtime/events';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function createAndPush(params: CreateNotificationParams): Promise<void> {
  const notification = await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(params.userId),
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data,
    read: false,
  });

  // Push to connected sockets (fire-and-forget if user is offline)
  ConnectionRegistry.broadcast(params.userId, {
    type: WS_EVENTS.NOTIFICATION,
    payload: notification,
  });
}

export async function getNotifications(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ notifications: typeof NotificationModel.prototype[]; total: number }> {
  const [notifications, total] = await Promise.all([
    NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    NotificationModel.countDocuments({ userId }),
  ]);
  return { notifications, total };
}

export async function markRead(notificationId: string, userId: string): Promise<void> {
  await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true }
  );
}

export async function markAllRead(userId: string): Promise<void> {
  await NotificationModel.updateMany({ userId, read: false }, { read: true });
}
