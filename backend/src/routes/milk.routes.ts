import { Router } from 'express';
import milkController from '../controllers/milk.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, milkCollectionSchema } from '../utils/validation';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/milk/collections:
 *   post:
 *     summary: Create milk collection
 *     tags: [Milk Collections]
 *     description: Record a new milk collection (Driver only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_id
 *               - center_id
 *               - collection_date
 *               - collection_time
 *               - milk_type
 *               - milk_weight
 *               - fat_percentage
 *               - snf_percentage
 *             properties:
 *               vendor_id:
 *                 type: string
 *                 format: uuid
 *                 example: "10000000-0000-0000-0000-000000000001"
 *               center_id:
 *                 type: string
 *                 format: uuid
 *                 example: "10000000-0000-0000-0000-000000000001"
 *               collection_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-27"
 *               collection_time:
 *                 type: string
 *                 enum: [morning, evening]
 *                 example: "morning"
 *               milk_type:
 *                 type: string
 *                 enum: [cow, buffalo, mix_milk]
 *                 example: "cow"
 *               milk_weight:
 *                 type: number
 *                 example: 50.5
 *                 description: Weight in kg
 *               fat_percentage:
 *                 type: number
 *                 example: 4.5
 *                 minimum: 0
 *                 maximum: 100
 *               snf_percentage:
 *                 type: number
 *                 example: 8.5
 *                 minimum: 0
 *                 maximum: 100
 *               can_number:
 *                 type: string
 *                 example: "CAN-001"
 *               can_weight_kg:
 *                 type: number
 *                 example: 2.5
 *               quality_notes:
 *                 type: string
 *                 example: "Good quality milk"
 *     responses:
 *       201:
 *         description: Milk collection created successfully
 *       400:
 *         description: Validation error or milk price not set
 *       401:
 *         description: Unauthorized
 */
router.post('/collections', validate(milkCollectionSchema), milkController.createCollection.bind(milkController));

/**
 * @swagger
 * /api/milk/collections:
 *   get:
 *     summary: Get milk collections
 *     tags: [Milk Collections]
 *     description: Get list of milk collections with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vendor ID
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: collection_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by collection date
 *       - in: query
 *         name: collection_time
 *         schema:
 *           type: string
 *           enum: [morning, evening]
 *         description: Filter by collection time
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [collected, delivered, processed, rejected]
 *         description: Filter by status
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
 *         description: List of milk collections
 *       401:
 *         description: Unauthorized
 */
router.get('/collections', milkController.getCollections.bind(milkController));

/**
 * @swagger
 * /api/milk/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Milk Collections]
 *     description: Get milk collection statistics for dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for statistics. Default is today
 *     responses:
 *       200:
 *         description: Dashboard statistics
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
 *                     todayTotalMilk:
 *                       type: number
 *                       example: 150.5
 *                     morningMilk:
 *                       type: number
 *                       example: 80.25
 *                     eveningMilk:
 *                       type: number
 *                       example: 70.25
 *                     thisMonthMilk:
 *                       type: number
 *                       example: 4500.75
 *                     lastMonthMilk:
 *                       type: number
 *                       example: 4200.50
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/stats', milkController.getDashboardStats.bind(milkController));

/**
 * @swagger
 * /api/milk/price/today:
 *   get:
 *     summary: Get today's milk price
 *     tags: [Milk Collections]
 *     description: Get the current milk price configuration for today
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: milk_type
 *         schema:
 *           type: string
 *           enum: [cow, buffalo, mix_milk]
 *           default: mix_milk
 *         description: Type of milk
 *     responses:
 *       200:
 *         description: Today's milk price
 *       404:
 *         description: Milk price not set for today
 *       401:
 *         description: Unauthorized
 */
router.get('/price/today', milkController.getTodayPrice.bind(milkController));

/**
 * @swagger
 * /api/milk/collections/{id}:
 *   get:
 *     summary: Get collection by ID
 *     tags: [Milk Collections]
 *     security:
 *       - bearerAuth: []
 */
router.get('/collections/:id', milkController.getCollectionById.bind(milkController));

/**
 * @swagger
 * /api/milk/collections/{id}:
 *   patch:
 *     summary: Update milk collection
 *     tags: [Milk Collections]
 *     description: Update milk collection (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.patch('/collections/:id', milkController.updateCollection.bind(milkController));

export default router;

