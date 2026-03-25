import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'ride_request_received'
  | 'request_approved'
  | 'request_rejected'
  | 'ride_cancelled'
  | 'ride_updated';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'ride_request_received',
        'request_approved',
        'request_rejected',
        'ride_cancelled',
        'ride_updated',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL: auto-delete after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
// Efficient unread feed query
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
