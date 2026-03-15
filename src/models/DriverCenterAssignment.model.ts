import mongoose, { Schema, Document } from 'mongoose';

export interface IDriverCenterAssignment extends Document {
  driver_id: string;
  center_id: string;
  assigned_at: Date;
  is_active: boolean;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const DriverCenterAssignmentSchema = new Schema<IDriverCenterAssignment>(
  {
    driver_id: { type: String, required: true },
    center_id: { type: String, required: true },
    assigned_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
    created_by: String,
    modified_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } }
);

DriverCenterAssignmentSchema.index({ driver_id: 1, center_id: 1 });

export const DriverCenterAssignmentModel = mongoose.model<IDriverCenterAssignment>(
  'DriverCenterAssignment',
  DriverCenterAssignmentSchema
);
