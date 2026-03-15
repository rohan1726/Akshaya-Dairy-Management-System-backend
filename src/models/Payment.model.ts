import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  vendor_id: string;
  payment_code: string;
  payment_type: string;
  payment_month?: Date;
  total_amount: number;
  advance_amount: number;
  previous_pending: number;
  deductions: number;
  final_amount: number;
  status: string;
  payment_notes?: string;
  transaction_id?: string;
  payment_method?: string;
  paid_at?: Date;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const PaymentSchema = new Schema<IPayment>(
  {
    vendor_id: { type: String, required: true },
    payment_code: { type: String, required: true },
    payment_type: { type: String, required: true },
    payment_month: Date,
    total_amount: { type: Number, required: true },
    advance_amount: { type: Number, default: 0 },
    previous_pending: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    final_amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    payment_notes: String,
    transaction_id: String,
    payment_method: String,
    paid_at: Date,
    created_by: String,
    modified_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } }
);

PaymentSchema.index({ vendor_id: 1 });
PaymentSchema.index({ payment_code: 1 });

export const PaymentModel = mongoose.model<IPayment>('Payment', PaymentSchema);
