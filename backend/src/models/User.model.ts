import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  mobile_no: string;
  email?: string;
  password: string;
  role: 'admin' | 'driver' | 'vendor';
  first_name?: string;
  last_name?: string;
  aadhar_card?: string;
  pan_card?: string;
  is_active: boolean;
  is_verified: boolean;
  date_of_birth?: Date;
  profile_image?: any;
  address?: any;
  created_at: Date;
  modified_at: Date;
  created_by?: string;
  modified_by?: string;
}

const UserSchema = new Schema<IUser>(
  {
    mobile_no: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'driver', 'vendor'] },
    first_name: String,
    last_name: String,
    aadhar_card: String,
    pan_card: String,
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: false },
    date_of_birth: Date,
    profile_image: Schema.Types.Mixed,
    address: Schema.Types.Mixed,
    created_by: String,
    modified_by: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' },
  }
);

UserSchema.index({ mobile_no: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ is_active: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
