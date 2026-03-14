import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user_id?: string;
  user_role: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  metadata?: any;
  read_at?: Date;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>({
  user_id: String,
  user_role: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  priority: { type: String, default: 'medium' },
  is_read: { type: Boolean, default: false },
  metadata: Schema.Types.Mixed,
  read_at: Date,
  created_at: { type: Date, default: Date.now },
});

NotificationSchema.index({ user_id: 1 });
NotificationSchema.index({ user_role: 1 });

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
