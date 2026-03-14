import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  action: string;
  entity_type: string;
  entity_id?: string;
  user_id?: string;
  details?: any;
  created_at: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  action: { type: String, required: true },
  entity_type: { type: String, required: true },
  entity_id: String,
  user_id: String,
  details: Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now },
});

ActivityLogSchema.index({ entity_type: 1, entity_id: 1 });
ActivityLogSchema.index({ created_at: -1 });

export const ActivityLogModel = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
