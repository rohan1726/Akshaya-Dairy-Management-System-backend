import { Response } from 'express';
import {
  UserModel,
  DriverModel,
  DriverCenterAssignmentModel,
} from '../models';
import { toApiDoc } from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/types';
import bcrypt from 'bcrypt';

export class DriverAdminController {
  async createDriver(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can create drivers' });
        return;
      }

      const {
        mobile_no,
        email,
        password,
        first_name,
        last_name,
        center_id,
        license_number,
        license_expiry,
        vehicle_number,
        vehicle_type,
        salary_per_month,
        joining_date,
        emergency_contact_name,
        emergency_contact_mobile,
      } = req.body;

      const hashedPassword = await bcrypt.hash(password || 'password123', 10);
      const user = await UserModel.create({
        mobile_no,
        email: email || null,
        password: hashedPassword,
        role: 'driver',
        first_name,
        last_name,
        is_active: true,
        is_verified: true,
      });

      const driver = await DriverModel.create({
        driver_id: user._id.toString(),
        center_id: center_id || null,
        license_number,
        license_expiry: license_expiry ? new Date(license_expiry) : null,
        vehicle_number,
        vehicle_type,
        salary_per_month: salary_per_month || 0,
        joining_date: joining_date ? new Date(joining_date) : new Date(),
        is_on_duty: false,
        emergency_contact_name,
        emergency_contact_mobile,
        created_by: req.user.userId,
      });

      if (center_id) {
        await DriverCenterAssignmentModel.create({
          driver_id: driver._id.toString(),
          center_id,
          is_active: true,
          created_by: req.user.userId,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        data: { ...toApiDoc(driver), user: toApiDoc(user) },
      });
    } catch (error: any) {
      logger.error('Create driver error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create driver',
      });
    }
  }

  async updateDriver(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can update drivers' });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const driver = await DriverModel.findByIdAndUpdate(
        id,
        { ...updateData, modified_by: req.user.userId },
        { new: true }
      );

      if (!driver) {
        res.status(404).json({ success: false, message: 'Driver not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Driver updated successfully',
        data: toApiDoc(driver),
      });
    } catch (error: any) {
      logger.error('Update driver error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update driver',
      });
    }
  }

  async toggleDriverDuty(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can toggle driver duty' });
        return;
      }

      const { id } = req.params;
      const driver = await DriverModel.findById(id);

      if (!driver) {
        res.status(404).json({ success: false, message: 'Driver not found' });
        return;
      }

      const driverService = (await import('../services/driver.service')).default;
      const updated = await driverService.updateDutyStatusByDriverId(
        id,
        !driver.is_on_duty,
        req.user.userId
      );

      res.json({
        success: true,
        message: `Driver ${updated.is_on_duty ? 'set to on-duty' : 'set to off-duty'}`,
        data: updated,
      });
    } catch (error: any) {
      logger.error('Toggle driver duty error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to toggle driver duty',
      });
    }
  }

  async toggleDriverStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can toggle driver status' });
        return;
      }

      const { id } = req.params;
      const driver = await DriverModel.findById(id).lean();
      if (!driver) {
        res.status(404).json({ success: false, message: 'Driver not found' });
        return;
      }

      const user = await UserModel.findById(driver.driver_id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      user.is_active = !user.is_active;
      await user.save();

      res.json({
        success: true,
        message: `Driver ${user.is_active ? 'activated' : 'deactivated'} successfully`,
        data: { is_active: user.is_active },
      });
    } catch (error: any) {
      logger.error('Toggle driver status error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to toggle driver status',
      });
    }
  }

  async assignCenter(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can assign centers' });
        return;
      }

      const { id } = req.params;
      const { center_id } = req.body;

      const driver = await DriverModel.findById(id);
      if (!driver) {
        res.status(404).json({ success: false, message: 'Driver not found' });
        return;
      }

      await DriverCenterAssignmentModel.updateMany(
        { driver_id: id, is_active: true },
        { is_active: false }
      );

      if (center_id) {
        await DriverCenterAssignmentModel.create({
          driver_id: id,
          center_id,
          is_active: true,
          created_by: req.user.userId,
        });
        driver.center_id = center_id;
        await driver.save();
      }

      res.json({
        success: true,
        message: 'Center assigned successfully',
      });
    } catch (error: any) {
      logger.error('Assign center error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to assign center',
      });
    }
  }
}

export default new DriverAdminController();
