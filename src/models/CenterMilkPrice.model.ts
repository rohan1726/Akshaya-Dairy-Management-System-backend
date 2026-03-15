import mongoose, { Schema, Document } from 'mongoose';

export interface ICenterMilkPrice extends Document {
  center_id: string;
  price_date: Date;
  milk_type: 'cow' | 'buffalo' | 'mix_milk';
  base_price: number;
  net_price?: number;
  old_base_price?: number;
  old_net_price?: number;
  base_fat: number;
  base_snf: number;
  fat_rate: number;
  snf_rate: number;
  bonus: number;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const CenterMilkPriceSchema = new Schema<ICenterMilkPrice>(
  {
    center_id: { type: String, required: true },
    price_date: { type: Date, required: true },
    milk_type: { type: String, required: true, enum: ['cow', 'buffalo', 'mix_milk'] },
    base_price: { type: Number, required: true },
    net_price: Number,
    old_base_price: Number,
    old_net_price: Number,
    base_fat: { type: Number, required: true },
    base_snf: { type: Number, required: true },
    fat_rate: { type: Number, required: true },
    snf_rate: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    notes: String,
    is_active: { type: Boolean, default: true },
    created_by: String,
    modified_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } }
);

CenterMilkPriceSchema.index({ center_id: 1, price_date: 1, milk_type: 1 });

export const CenterMilkPriceModel = mongoose.model<ICenterMilkPrice>('CenterMilkPrice', CenterMilkPriceSchema);
