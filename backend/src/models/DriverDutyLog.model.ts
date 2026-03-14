import mongoose, { Schema, Document } from 'mongoose';

export interface IDriverDutyLog extends Document {
  driver_id: string;
  duty_date: Date;
  shift: 'morning' | 'evening';
  is_on_duty: boolean;
  duty_started_at?: Date;
  duty_ended_at?: Date;
  notes?: string;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const DriverDutyLogSchema = new Schema<IDriverDutyLog>(
  {
    driver_id: { type: String, required: true },
    duty_date: { type: Date, required: true },
    shift: { type: String, required: true, enum: ['morning', 'evening'] },
    is_on_duty: { type: Boolean, default: false },
    duty_started_at: Date,
    duty_ended_at: Date,
    notes: String,
    created_by: String,
    modified_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } }
);

DriverDutyLogSchema.index({ driver_id: 1, duty_date: 1, shift: 1 }, { unique: true });

export const DriverDutyLogModel = mongoose.model<IDriverDutyLog>('DriverDutyLog', DriverDutyLogSchema);
