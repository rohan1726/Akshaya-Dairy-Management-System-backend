import { Response } from 'express';
import { UserModel, DairyCenterModel, ActivityLogModel } from '../models';
import { toApiDoc, toApiDocs } from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export class DairyCenterController {
  async createCenter(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can create centers' });
        return;
      }

      const { dairy_name, contact_mobile, email, password, address, first_name, last_name } = req.body;

      const hashedPassword = await bcrypt.hash(password || 'password123', 10);
      const user = await UserModel.create({
        mobile_no: contact_mobile,
        email: email || null,
        password: hashedPassword,
        role: 'vendor',
        first_name: first_name || dairy_name,
        last_name: last_name || '',
        is_active: true,
        is_verified: true,
      });

      const qrCode = `DC-${uuidv4().substring(0, 8).toUpperCase()}`;
      const center = await DairyCenterModel.create({
        user_id: user._id.toString(),
        dairy_name,
        contact_mobile,
        address: address || {},
        qr_code: qrCode,
        is_active: true,
        created_by: req.user.userId,
      });

      await ActivityLogModel.create({
        user_id: req.user.userId,
        action: 'create_dairy_center',
        entity_type: 'dairy_center',
        entity_id: center._id.toString(),
        details: { dairy_name },
      });

      res.status(201).json({
        success: true,
        message: 'Dairy center created successfully',
        data: { ...toApiDoc(center), user: toApiDoc(user) },
      });
    } catch (error: any) {
      logger.error('Create center error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create dairy center',
      });
    }
  }

  async updateCenter(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can update centers' });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const center = await DairyCenterModel.findByIdAndUpdate(
        id,
        { ...updateData, modified_by: req.user.userId },
        { new: true }
      );

      if (!center) {
        res.status(404).json({ success: false, message: 'Dairy center not found' });
        return;
      }

      await ActivityLogModel.create({
        user_id: req.user.userId,
        action: 'update_dairy_center',
        entity_type: 'dairy_center',
        entity_id: center._id.toString(),
        details: { dairy_name: center.dairy_name },
      });

      res.json({
        success: true,
        message: 'Dairy center updated successfully',
        data: toApiDoc(center),
      });
    } catch (error: any) {
      logger.error('Update center error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update dairy center',
      });
    }
  }

  async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can toggle center status' });
        return;
      }

      const { id } = req.params;
      const center = await DairyCenterModel.findById(id);
      if (!center) {
        res.status(404).json({ success: false, message: 'Dairy center not found' });
        return;
      }

      center.is_active = !center.is_active;
      await center.save();

      await UserModel.findByIdAndUpdate(center.user_id, { is_active: center.is_active });

      res.json({
        success: true,
        message: `Center ${center.is_active ? 'activated' : 'deactivated'} successfully`,
        data: toApiDoc(center),
      });
    } catch (error: any) {
      logger.error('Toggle center status error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to toggle center status',
      });
    }
  }

  async getAllCenters(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can view all centers' });
        return;
      }

      const centers = await DairyCenterModel.find().sort({ created_at: -1 }).lean();
      const userIds = centers.map((c: { user_id: string }) => c.user_id);
      const users = await UserModel.find({ _id: { $in: userIds } }).lean();
      const userMap = new Map(users.map((u: { _id: any; first_name?: string; last_name?: string; email?: string; mobile_no?: string }) => [u._id.toString(), u]));

      const data = centers.map((c: { user_id: string; [key: string]: any }) => {
        const u = userMap.get(c.user_id) as { first_name?: string; last_name?: string; email?: string; mobile_no?: string } | undefined;
        return {
          ...toApiDoc(c),
          first_name: u?.first_name,
          last_name: u?.last_name,
          email: u?.email,
          user_mobile: u?.mobile_no,
        };
      });

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Get all centers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch centers',
      });
    }
  }

  async getCenterById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const center = await DairyCenterModel.findById(id).lean();
      if (!center) {
        res.status(404).json({ success: false, message: 'Dairy center not found' });
        return;
      }

      const user = await UserModel.findById(center.user_id).lean();
      const data = {
        ...toApiDoc(center),
        first_name: user?.first_name,
        last_name: user?.last_name,
        email: user?.email,
        user_mobile: user?.mobile_no,
      };

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Get center by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch center',
      });
    }
  }
}

export default new DairyCenterController();
