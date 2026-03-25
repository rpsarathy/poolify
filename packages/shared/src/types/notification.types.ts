export type NotificationType =
  | 'ride_request_received'
  | 'request_approved'
  | 'request_rejected'
  | 'ride_cancelled'
  | 'ride_updated';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type WsEvent =
  | { type: 'notification'; payload: Notification }
  | { type: 'init'; payload: Notification[] }
  | { type: 'ping' }
  | { type: 'pong' };
