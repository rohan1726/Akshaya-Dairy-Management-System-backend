import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/reports/center-collections:
 *   get:
 *     summary: Get center collections report
 *     tags: [Reports]
 *     description: Get collections for a specific center or all centers within date range (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: center_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Center ID (optional, if not provided returns all centers)
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Collections report
 */
router.get('/center-collections', reportController.getCenterCollections.bind(reportController));

/**
 * @swagger
 * /api/reports/driver-salary:
 *   get:
 *     summary: Get driver salary report
 *     tags: [Reports]
 *     description: Get driver salary calculation for date range (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *     responses:
 *       200:
 *         description: Driver salary report
 */
router.get('/driver-salary', reportController.getDriverSalary.bind(reportController));

export default router;

