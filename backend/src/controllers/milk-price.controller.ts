import { Response } from 'express';
import milkPriceService from '../services/milk-price.service';
import { validate, milkPriceSchema } from '../utils/validation';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/types';

export class MilkPriceController {
  async setDailyPrice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can set milk prices' });
        return;
      }

      const priceData = {
        ...req.body,
        created_by: req.user.userId,
      };

      const price = await milkPriceService.setDailyPrice(priceData);

      res.json({
        success: true,
        message: 'Milk price set successfully',
        data: price,
      });
    } catch (error: any) {
      logger.error('Set daily price error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to set milk price',
      });
    }
  }

  async getPrice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { date, milk_type } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const milkType = (milk_type as any) || 'cow';

      const price = await milkPriceService.getPrice(targetDate, milkType);

      if (!price) {
        res.status(404).json({
          success: false,
          message: `Milk price not set for ${milkType} on ${targetDate.toISOString().split('T')[0]}`,
        });
        return;
      }

      res.json({
        success: true,
        data: price,
      });
    } catch (error: any) {
      logger.error('Get price error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch price',
      });
    }
  }

  async getPrices(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters: any = {};

      if (req.query.start_date) {
        filters.start_date = new Date(req.query.start_date as string);
      }
      if (req.query.end_date) {
        filters.end_date = new Date(req.query.end_date as string);
      }
      if (req.query.milk_type) {
        filters.milk_type = req.query.milk_type;
      }
      filters.limit = parseInt(req.query.limit as string) || 50;
      filters.offset = parseInt(req.query.offset as string) || 0;

      const prices = await milkPriceService.getPrices(filters);

      res.json({
        success: true,
        data: prices,
      });
    } catch (error: any) {
      logger.error('Get prices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prices',
      });
    }
  }

  async calculatePreview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { milk_type, fat_percentage, snf_percentage, date } = req.query;

      if (!milk_type || !fat_percentage || !snf_percentage) {
        res.status(400).json({
          success: false,
          message: 'milk_type, fat_percentage, and snf_percentage are required',
        });
        return;
      }

      const targetDate = date ? new Date(date as string) : undefined;
      const preview = await milkPriceService.calculatePricePreview(
        milk_type as any,
        parseFloat(fat_percentage as string),
        parseFloat(snf_percentage as string),
        targetDate
      );

      res.json({
        success: true,
        data: preview,
      });
    } catch (error: any) {
      logger.error('Calculate preview error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to calculate price preview',
      });
    }
  }
}

export default new MilkPriceController();



