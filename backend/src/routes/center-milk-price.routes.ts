import { Router } from 'express';
import centerMilkPriceController from '../controllers/center-milk-price.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/milk/center-price:
 *   post:
 *     summary: Set center-specific milk price
 *     tags: [Milk Pricing]
 *     description: Set or update center-specific milk price (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.post('/center-price', centerMilkPriceController.setCenterPrice.bind(centerMilkPriceController));

/**
 * @swagger
 * /api/milk/center-price:
 *   get:
 *     summary: Get center-specific milk price
 *     tags: [Milk Pricing]
 *     description: Get center-specific milk price for a date and milk type
 *     security:
 *       - bearerAuth: []
 */
router.get('/center-price', centerMilkPriceController.getCenterPrice.bind(centerMilkPriceController));

export default router;

