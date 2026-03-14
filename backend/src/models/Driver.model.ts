import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  driver_id: string; // user id
  center_id?: string;
  aadhar_card?: any;
  pan_card?: any;
  license_number?: string;
  license_expiry?: Date;
  vehicle_number?: string;
  vehicle_type?: string;
  salary_per_month?: number;
  joining_date?: Date;
  is_on_duty: boolean;
  emergency_contact_name?: string;
  emergency_contact_mobile?: string;
  additional_info?: any;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const DriverSchema = new Schema<IDriver>(
  {
    driver_id: { type: String, required: true },
    center_id: String,
    aadhar_card: Schema.Types.Mixed,
    pan_card: Schema.Types.Mixed,
    license_number: String,
    license_expiry: Date,
    vehicle_number: String,
    vehicle_type: String,
    salary_per_month: Number,
    joining_date: Date,
    is_on_duty: { type: Boolean, default: false },
    emergency_contact_name: String,
    emergency_contact_mobile: String,
    additional_info: Schema.Types.Mixed,
    created_by: String,
    modified_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } }
);

DriverSchema.index({ driver_id: 1 });
DriverSchema.index({ center_id: 1 });

export const DriverModel = mongoose.model<IDriver>('Driver', DriverSchema);
