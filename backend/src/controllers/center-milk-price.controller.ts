import { Response } from 'express';
import centerMilkPriceService from '../services/center-milk-price.service';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/types';
import milkPriceService from '../services/milk-price.service';

export class CenterMilkPriceController {
  async setCenterPrice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ success: false, message: 'Only admin can set center prices' });
        return;
      }

      const {
        center_id,
        price_date,
        milk_type,
        base_price,
        net_price,
      } = req.body;

      // Get default base_fat, base_snf, fat_rate, snf_rate, bonus from global milk price
      const date = price_date ? new Date(price_date) : new Date();
      const globalPrice = await milkPriceService.getPrice(date, milk_type);

      if (!globalPrice) {
        res.status(400).json({
          success: false,
          message: `Global milk price not set for ${milk_type} on ${date.toISOString().split('T')[0]}. Please set global price first.`,
        });
        return;
      }

      const centerPrice = await centerMilkPriceService.setCenterPrice({
        center_id,
        price_date: date,
        milk_type,
        base_price: parseFloat(base_price),
        net_price: net_price ? parseFloat(net_price) : undefined,
        base_fat: globalPrice.base_fat || 0,
        base_snf: globalPrice.base_snf || 0,
        fat_rate: globalPrice.fat_rate,
        snf_rate: globalPrice.snf_rate,
        bonus: globalPrice.bonus || 0,
        created_by: req.user.userId,
      });

      res.json({
        success: true,
        message: 'Center milk price set successfully',
        data: centerPrice,
      });
    } catch (error: any) {
      logger.error('Set center price error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to set center price',
      });
    }
  }

  async getCenterPrice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const centerId = req.query.center_id as string;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const milkType = (req.query.milk_type as any) || 'cow';

      if (!centerId) {
        res.status(400).json({ success: false, message: 'center_id is required' });
        return;
      }

      const price = await centerMilkPriceService.getCenterPrice(centerId, date, milkType);

      res.json({
        success: true,
        data: price,
      });
    } catch (error: any) {
      logger.error('Get center price error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch center price',
      });
    }
  }
}

export default new CenterMilkPriceController();

