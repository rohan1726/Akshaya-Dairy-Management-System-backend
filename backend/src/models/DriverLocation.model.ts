import mongoose, { Schema, Document } from 'mongoose';

export interface IDriverLocation extends Document {
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  address?: string;
  recorded_at: Date;
}

const DriverLocationSchema = new Schema<IDriverLocation>({
  driver_id: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: Number,
  speed: Number,
  address: String,
  recorded_at: { type: Date, default: Date.now },
});

DriverLocationSchema.index({ driver_id: 1 });
DriverLocationSchema.index({ recorded_at: -1 });

export const DriverLocationModel = mongoose.model<IDriverLocation>('DriverLocation', DriverLocationSchema);
