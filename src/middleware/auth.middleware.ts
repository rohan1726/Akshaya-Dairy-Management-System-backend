import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../models/types';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const checkDriverActive = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'driver') {
      next();
      return;
    }

    const { UserModel } = await import('../models');
    const user = await UserModel.findById(req.user.userId).lean();

    if (!user || !user.is_active) {
      res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact admin.',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Check driver active error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify driver status',
    });
  }
};

