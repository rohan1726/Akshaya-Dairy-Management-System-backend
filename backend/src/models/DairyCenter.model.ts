import mongoose, { Schema, Document } from 'mongoose';

export interface IDairyCenter extends Document {
  user_id: string;
  dairy_name: string;
  address?: any;
  contact_mobile?: string;
  is_active: boolean;
  center_image?: any;
  qr_code?: string;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const DairyCenterSchema = new Schema<IDairyCenter>(
  {
    user_id: { type: String, required: true },
    dairy_name: { type: String, required: true },
    address: Schema.Types.Mixed,
    contact_mobile: String,
    is_active: { type: Boolean, default: true },
    center_image: Schema.Types.Mixed,
    qr_code: String,
    created_by: String,
    modified_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } }
);

DairyCenterSchema.index({ user_id: 1 });
DairyCenterSchema.index({ is_active: 1 });

export const DairyCenterModel = mongoose.model<IDairyCenter>('DairyCenter', DairyCenterSchema);
