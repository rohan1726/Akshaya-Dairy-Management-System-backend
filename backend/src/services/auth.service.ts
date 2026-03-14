import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel } from '../models';
import { toApiDoc } from '../config/database';
import { User, UserRole, JwtPayload } from '../models/types';
import logger from '../utils/logger';

export class AuthService {
  async login(mobileOrEmail: string, password: string): Promise<{
    user: Omit<User, 'password'>;
    token: string;
  }> {
    const user = await UserModel.findOne({
      $or: [{ mobile_no: mobileOrEmail }, { email: mobileOrEmail }],
      is_active: true,
    }).lean();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_verified) {
      throw new Error('Account not verified. Please contact admin.');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    const payload: JwtPayload = {
      userId: user._id.toString(),
      role: user.role as UserRole,
      email: user.email,
      mobile_no: user.mobile_no,
    };

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: expiresIn,
    } as SignOptions);

    const { password: _, ...userWithoutPassword } = user;
    const apiUser = toApiDoc(user as any);
    if (apiUser) delete (apiUser as any).password;

    return {
      user: { ...apiUser, id: user._id.toString() } as Omit<User, 'password'>,
      token,
    };
  }

  async register(userData: {
    mobile_no: string;
    email?: string;
    password: string;
    role: UserRole;
    first_name?: string;
    last_name?: string;
  }): Promise<Omit<User, 'password'>> {
    const existingUser = await UserModel.findOne({
      $or: [
        { mobile_no: userData.mobile_no },
        ...(userData.email ? [{ email: userData.email }] : []),
      ],
    });

    if (existingUser) {
      throw new Error('User with this mobile number or email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await UserModel.create({
      ...userData,
      password: hashedPassword,
      is_active: true,
      is_verified: userData.role === UserRole.ADMIN,
    });

    const out = toApiDoc(user);
    if (out) delete (out as any).password;
    return out as Omit<User, 'password'>;
  }

  async getCurrentUser(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await UserModel.findById(userId).lean();
    if (!user) return null;

    const out = toApiDoc(user as any);
    if (out) delete (out as any).password;
    return out as Omit<User, 'password'>;
  }
}

export default new AuthService();
