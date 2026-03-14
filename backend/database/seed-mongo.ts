/**
 * MongoDB seed: creates default admin user if no users exist.
 * Run from backend folder: npm run seed
 */
import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../src/models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akshaya_dairy';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const existing = await UserModel.countDocuments();
  if (existing > 0) {
    console.log('Users already exist, skipping seed.');
    await mongoose.disconnect();
    return;
  }
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  await UserModel.create({
    mobile_no: process.env.ADMIN_MOBILE || '9999999999',
    email: process.env.ADMIN_EMAIL || 'admin@akshayadairy.com',
    password: hashed,
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    is_verified: true,
  });
  console.log('Default admin user created.');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
