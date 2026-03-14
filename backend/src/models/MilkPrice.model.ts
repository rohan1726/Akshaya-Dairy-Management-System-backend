import mongoose, { Schema, Document } from 'mongoose';

export interface IMilkPrice extends Document {
  price_date: Date;
  milk_type: 'cow' | 'buffalo' | 'mix_milk';
  base_price: number;
  base_fat: number;
  base_snf: number;
  fat_rate: number;
  snf_rate: number;
  bonus: number;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const MilkPriceSchema = new Schema<IMilkPrice>(
  {
    price_date: { type: Date, required: true },
    milk_type: { type: String, required: true, enum: ['cow', 'buffalo', 'mix_milk'] },
    base_price: { type: Number, required: true },
    base_fat: { type: Number, required: true },
    base_snf: { type: Number, required: true },
    fat_rate: { type: Number, required: true },
    snf_rate: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    notes: String,
    created_by: String,
    modified_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } }
);

MilkPriceSchema.index({ price_date: 1, milk_type: 1 });
MilkPriceSchema.index({ is_active: 1 });

export const MilkPriceModel = mongoose.model<IMilkPrice>('MilkPrice', MilkPriceSchema);
