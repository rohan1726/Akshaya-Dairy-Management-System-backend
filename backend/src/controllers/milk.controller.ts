import { Response } from 'express';
import milkService from '../services/milk.service';
import { validate, milkCollectionSchema, milkPriceSchema } from '../utils/validation';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

export class MilkController {
  async createCollection(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { DriverModel } = await import('../models');
      let driverId: string | undefined;
      if (req.user.role === 'driver') {
        const driverRecord = await DriverModel.findOne({ driver_id: req.user.userId });
        if (!driverRecord) {
          res.status(404).json({ success: false, message: 'Driver record not found. Please contact admin.' });
          return;
        }
        driverId = req.user.userId; // store user id in milk_collections.driver_id
      } else if (req.body.driver_id) {
        driverId = req.body.driver_id; // admin can pass driver user id
      }

      const collectionData = {
        ...req.body,
        driver_id: driverId,
        created_by: req.user.userId,
      };

      const collection = await milkService.createCollection(collectionData);

      res.status(201).json({
        success: true,
        message: 'Milk collection recorded successfully',
        data: collection,
      });
    } catch (error: any) {
      logger.error('Create collection error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create collection',
      });
    }
  }

  async getCollections(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const filters: any = {
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      // Role-based filtering
      if (req.user.role === 'driver') {
        filters.driver_id = req.user.userId;
      } else if (req.user.role === 'vendor') {
        const { DairyCenterModel } = await import('../models');
        const center = await DairyCenterModel.findOne({ user_id: req.user.userId }).lean();
        if (center) filters.center_id = center._id.toString();
      }

      if (req.query.start_date && req.query.end_date) {
        filters.start_date = req.query.start_date as string;
        filters.end_date = req.query.end_date as string;
      } else if (req.query.collection_date) {
        filters.collection_date = new Date(req.query.collection_date as string);
      }
      if (req.query.collection_time) {
        filters.collection_time = req.query.collection_time;
      }
      if (req.query.status) {
        filters.status = req.query.status;
      }
      // Use center_id instead of vendor_id
      if (req.query.center_id) {
        filters.center_id = req.query.center_id as string;
      }
      // Keep vendor_id for backward compatibility but map it to center_id
      if (req.query.vendor_id) {
        filters.center_id = req.query.vendor_id as string;
      }

      const collections = await milkService.getCollections(filters);

      res.json({
        success: true,
        data: collections,
      });
    } catch (error: any) {
      logger.error('Get collections error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch collections',
      });
    }
  }

  async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const stats = await milkService.getDashboardStats(date);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard stats',
      });
    }
  }

  async getTodayPrice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const milkType = (req.query.milk_type as any) || 'mix_milk';
      const centerId = req.query.center_id as string | undefined;
      
      // Ensure date is a valid Date object
      let date: Date;
      if (req.query.date) {
        date = new Date(req.query.date as string);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          date = new Date(); // Fallback to today if invalid
        }
      } else {
        date = new Date();
      }

      let price;
      if (centerId) {
        // Get center-specific price with fallback to global
        price = await milkService.getCenterPriceWithFallback(centerId, date, milkType);
      } else {
        // Get global price
        price = await milkService.getTodayPrice(milkType);
      }

      // If no price found, return default values instead of error
      if (!price) {
        const defaultPrices: Record<string, any> = {
          cow: {
            base_price: 36.00,
            base_fat: 3.5,
            base_snf: 8.5,
            fat_rate: 5.0,
            snf_rate: 5.0,
            bonus: 1.00,
          },
          buffalo: {
            base_price: 51.00,
            base_fat: 6.0,
            base_snf: 9.0,
            fat_rate: 5.0,
            snf_rate: 5.0,
            bonus: 1.00,
          },
          mix_milk: {
            base_price: 40.00,
            base_fat: 4.5,
            base_snf: 8.75,
            fat_rate: 5.0,
            snf_rate: 5.0,
            bonus: 1.00,
          },
        };

        const defaults = defaultPrices[milkType] || defaultPrices.mix_milk;
        price = {
          id: '',
          price_date: date,
          milk_type: milkType,
          base_price: defaults.base_price,
          base_fat: defaults.base_fat,
          base_snf: defaults.base_snf,
          fat_rate: defaults.fat_rate,
          snf_rate: defaults.snf_rate,
          bonus: defaults.bonus,
          is_active: true,
          notes: 'Default price - no price set for this date',
          created_at: new Date(),
          modified_at: new Date(),
          created_by: undefined,
          modified_by: undefined,
        };
      }

      res.json({
        success: true,
        data: price,
      });
    } catch (error: any) {
      logger.error('Get today price error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch price',
      });
    }
  }

  async updateCollection(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Only admin can update collections' });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const collection = await milkService.updateCollection(id, updateData, req.user.userId);

      res.json({
        success: true,
        message: 'Collection updated successfully',
        data: collection,
      });
    } catch (error: any) {
      logger.error('Update collection error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update collection',
      });
    }
  }

  async getCollectionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const collection = await milkService.getCollectionById(id);

      if (!collection) {
        res.status(404).json({ success: false, message: 'Collection not found' });
        return;
      }

      res.json({
        success: true,
        data: collection,
      });
    } catch (error: any) {
      logger.error('Get collection by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch collection',
      });
    }
  }
}

export default new MilkController();

