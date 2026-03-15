import { Router } from 'express';
import milkPriceController from '../controllers/milk-price.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, milkPriceSchema } from '../utils/validation';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/milk-price:
 *   post:
 *     summary: Set daily milk price
 *     tags: [Milk Pricing]
 *     description: Create or update daily milk price configuration (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price_date
 *               - base_price
 *               - base_fat
 *               - base_snf
 *               - fat_rate
 *               - snf_rate
 *               - milk_type
 *             properties:
 *               price_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-27"
 *               base_price:
 *                 type: number
 *                 example: 36.00
 *                 description: Base price for base FAT/SNF combination
 *               base_fat:
 *                 type: number
 *                 example: 3.5
 *                 description: Base FAT percentage (e.g., 3.5 for cow, 6.0 for buffalo)
 *               base_snf:
 *                 type: number
 *                 example: 8.5
 *                 description: Base SNF percentage (e.g., 8.5 for cow, 9.0 for buffalo)
 *               fat_rate:
 *                 type: number
 *                 example: 5.0
 *                 description: Rate per 1% FAT difference
 *               snf_rate:
 *                 type: number
 *                 example: 5.0
 *                 description: Rate per 1% SNF difference
 *               bonus:
 *                 type: number
 *                 example: 1.00
 *                 default: 0
 *                 description: Bonus amount (e.g., +1 Rs)
 *               milk_type:
 *                 type: string
 *                 enum: [cow, buffalo, mix_milk]
 *                 example: "cow"
 *               notes:
 *                 type: string
 *                 example: "Daily price for cow milk"
 *     responses:
 *       200:
 *         description: Milk price set successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Only admin can set milk prices
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(milkPriceSchema), milkPriceController.setDailyPrice.bind(milkPriceController));

/**
 * @swagger
 * /api/milk-price:
 *   get:
 *     summary: Get milk prices
 *     tags: [Milk Pricing]
 *     description: Get list of milk prices with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
 *       - in: query
 *         name: milk_type
 *         schema:
 *           type: string
 *           enum: [cow, buffalo, mix_milk]
 *         description: Filter by milk type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of milk prices
 *       401:
 *         description: Unauthorized
 */
router.get('/', milkPriceController.getPrices.bind(milkPriceController));

/**
 * @swagger
 * /api/milk-price/single:
 *   get:
 *     summary: Get single milk price
 *     tags: [Milk Pricing]
 *     description: Get milk price for a specific date and milk type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for price. Default is today
 *       - in: query
 *         name: milk_type
 *         schema:
 *           type: string
 *           enum: [cow, buffalo, mix_milk]
 *           default: cow
 *         description: Type of milk
 *     responses:
 *       200:
 *         description: Milk price
 *       404:
 *         description: Milk price not found
 *       401:
 *         description: Unauthorized
 */
router.get('/single', milkPriceController.getPrice.bind(milkPriceController));

/**
 * @swagger
 * /api/milk-price/preview:
 *   get:
 *     summary: Calculate price preview
 *     tags: [Milk Pricing]
 *     description: Preview the calculated rate for given FAT and SNF percentages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: milk_type
 *         schema:
 *           type: string
 *           enum: [cow, buffalo, mix_milk]
 *         required: true
 *         description: Type of milk
 *       - in: query
 *         name: fat_percentage
 *         schema:
 *           type: number
 *         required: true
 *         description: FAT percentage
 *         example: 4.0
 *       - in: query
 *         name: snf_percentage
 *         schema:
 *           type: number
 *         required: true
 *         description: SNF percentage
 *         example: 8.5
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for price calculation. Default is today
 *     responses:
 *       200:
 *         description: Price preview calculation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rate:
 *                       type: number
 *                       example: 39.50
 *                       description: Calculated rate per liter
 *                     price:
 *                       type: object
 *                       description: Price configuration used
 *       400:
 *         description: Missing required parameters or price not set
 *       401:
 *         description: Unauthorized
 */
router.get('/preview', milkPriceController.calculatePreview.bind(milkPriceController));

export default router;



