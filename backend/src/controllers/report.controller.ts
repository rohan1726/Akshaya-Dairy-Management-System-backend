import { Response } from 'express';
import { MilkCollectionModel, DairyCenterModel, DriverModel, UserModel } from '../models';
import { toApiDocs } from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/types';

export class ReportController {
  async getCenterCollections(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can view reports' });
        return;
      }

      const { center_id, start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        res.status(400).json({ success: false, message: 'start_date and end_date are required' });
        return;
      }

      const filter: any = {
        collection_date: {
          $gte: new Date(start_date as string),
          $lte: new Date(end_date as string),
        },
      };
      if (center_id) filter.vendor_id = center_id;

      const collections = await MilkCollectionModel.find(filter)
        .sort({ collection_date: -1 })
        .lean();

      const centerIds = [...new Set(collections.map((c: { vendor_id: string }) => c.vendor_id))];
      const centers = await DairyCenterModel.find({ _id: { $in: centerIds } }).lean();
      const centerMap = new Map(centers.map((c: { _id: any; dairy_name?: string }) => [c._id.toString(), c]));

      const data = collections.map((c: { vendor_id: string; _id: any; [key: string]: any }) => ({
        ...c,
        id: c._id.toString(),
        dairy_name: centerMap.get(c.vendor_id)?.dairy_name,
      }));

      const totals = data.reduce(
        (acc: any, col: any) => {
          acc.totalWeight += col.milk_weight || 0;
          acc.totalAmount += col.total_amount || 0;
          if (col.collection_time === 'morning') acc.morningWeight += col.milk_weight || 0;
          else acc.eveningWeight += col.milk_weight || 0;
          return acc;
        },
        { totalWeight: 0, totalAmount: 0, morningWeight: 0, eveningWeight: 0 }
      );

      res.json({
        success: true,
        data: {
          collections: toApiDocs(data as any),
          totals,
          period: { start_date, end_date, center_id: center_id || null },
        },
      });
    } catch (error: any) {
      logger.error('Get center collections error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch collections',
      });
    }
  }

  async getDriverSalary(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can view driver salary' });
        return;
      }

      const { driver_id, start_date, end_date } = req.query;

      if (!driver_id || !start_date || !end_date) {
        res.status(400).json({
          success: false,
          message: 'driver_id, start_date and end_date are required',
        });
        return;
      }

      const driver = await DriverModel.findById(driver_id).lean();
      if (!driver) {
        res.status(404).json({ success: false, message: 'Driver not found' });
        return;
      }

      const user = await UserModel.findById(driver.driver_id).lean();
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const start = new Date(start_date as string);
      const end = new Date(end_date as string);
      const collections = await MilkCollectionModel.find({
        driver_id: driver.driver_id,
        collection_date: { $gte: start, $lte: end },
      })
        .sort({ collection_date: -1 })
        .lean();

      const salary = driver.salary_per_month || 0;
      const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const baseSalary = (salary / 30) * daysInPeriod;
      const overtime = 0;
      const bonus = 0;
      const deductions = 0;
      const finalAmount = baseSalary + overtime + bonus - deductions;

      res.json({
        success: true,
        data: {
          driver: {
            id: driver._id.toString(),
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            mobile: user.mobile_no,
            vehicle_number: driver.vehicle_number,
          },
          period: { start_date, end_date, days: daysInPeriod },
          salary: { baseSalary, overtime, bonus, deductions, finalAmount },
          collections: collections.length,
        },
      });
    } catch (error: any) {
      logger.error('Get driver salary error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch driver salary',
      });
    }
  }
}

export default new ReportController();
