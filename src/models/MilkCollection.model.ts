import mongoose, { Schema, Document } from 'mongoose';

export interface IMilkCollection extends Document {
  vendor_id: string;
  driver_id?: string;
  center_id: string;
  collection_code: string;
  collection_date: Date;
  collection_time: 'morning' | 'evening';
  milk_type: 'cow' | 'buffalo' | 'mix_milk';
  milk_weight: number;
  base_value?: number;
  fat_percentage: number;
  snf_percentage: number;
  rate_per_liter: number;
  total_amount: number;
  can_number?: string;
  can_weight_kg?: number;
  quality_notes?: string;
  status: string;
  is_synced: boolean;
  collected_at: Date;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const MilkCollectionSchema = new Schema<IMilkCollection>(
  {
    vendor_id: { type: String, required: true },
    driver_id: String,
    center_id: { type: String, required: true },
    collection_code: { type: String, required: true },
    collection_date: { type: Date, required: true },
    collection_time: { type: String, required: true, enum: ['morning', 'evening'] },
    milk_type: { type: String, required: true, enum: ['cow', 'buffalo', 'mix_milk'] },
    milk_weight: { type: Number, required: true },
    base_value: Number,
    fat_percentage: Number,
    snf_percentage: Number,
    rate_per_liter: { type: Number, required: true },
    total_amount: { type: Number, required: true },
    can_number: String,
    can_weight_kg: Number,
    quality_notes: String,
    status: { type: String, default: 'collected' },
    is_synced: { type: Boolean, default: false },
    collected_at: { type: Date, default: Date.now },
    created_by: String,
    modified_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } }
);

MilkCollectionSchema.index({ center_id: 1, collection_date: 1 });
MilkCollectionSchema.index({ driver_id: 1, collection_date: 1 });
MilkCollectionSchema.index({ vendor_id: 1, collection_date: 1 });

export const MilkCollectionModel = mongoose.model<IMilkCollection>('MilkCollection', MilkCollectionSchema);
