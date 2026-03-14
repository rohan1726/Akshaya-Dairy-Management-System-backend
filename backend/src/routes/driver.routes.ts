import { Router } from 'express';
import driverController from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, driverLocationSchema } from '../utils/validation';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/driver/duty-status:
 *   patch:
 *     summary: Update driver duty status
 *     tags: [Driver]
 *     description: Toggle driver on/off duty status (Driver only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_on_duty
 *             properties:
 *               is_on_duty:
 *                 type: boolean
 *                 example: true
 *                 description: true for on-duty, false for off-duty
 *     responses:
 *       200:
 *         description: Duty status updated successfully
 *       403:
 *         description: Only drivers can update duty status
 *       401:
 *         description: Unauthorized
 */
router.patch('/duty-status', driverController.updateDutyStatus.bind(driverController));

/**
 * @swagger
 * /api/driver/location:
 *   post:
 *     summary: Save driver GPS location
 *     tags: [Driver]
 *     description: Save current GPS location of driver (Driver only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 18.5204
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 example: 73.8567
 *                 minimum: -180
 *                 maximum: 180
 *               accuracy:
 *                 type: number
 *                 example: 10.5
 *                 description: Accuracy in meters
 *               speed:
 *                 type: number
 *                 example: 25.5
 *                 description: Speed in km/h
 *               address:
 *                 type: string
 *                 example: "Pune, Maharashtra, India"
 *     responses:
 *       200:
 *         description: Location saved successfully
 *       403:
 *         description: Only drivers can save location
 *       401:
 *         description: Unauthorized
 */
router.post('/location', validate(driverLocationSchema), driverController.saveLocation.bind(driverController));

/**
 * @swagger
 * /api/driver/location/current:
 *   get:
 *     summary: Get driver's current location
 *     tags: [Driver]
 *     description: Get the most recent GPS location of a driver
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver ID (admin can view any driver, driver can only view own)
 *     responses:
 *       200:
 *         description: Current location
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Unauthorized
 */
router.get('/location/current', driverController.getCurrentLocation.bind(driverController));

/**
 * @swagger
 * /api/driver/location/history:
 *   get:
 *     summary: Get driver location history
 *     tags: [Driver]
 *     description: Get GPS location history for a driver
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver ID (admin can view any driver, driver can only view own)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *     responses:
 *       200:
 *         description: Location history
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Unauthorized
 */
router.get('/location/history', driverController.getLocationHistory.bind(driverController));

/**
 * @swagger
 * /api/driver/centers:
 *   get:
 *     summary: Get assigned dairy centers
 *     tags: [Driver]
 *     description: Get list of dairy centers assigned to the driver (Driver only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned centers
 *       403:
 *         description: Only drivers can view assigned centers
 *       401:
 *         description: Unauthorized
 */
router.get('/centers', driverController.getAssignedCenters.bind(driverController));

/**
 * @swagger
 * /api/driver/status:
 *   get:
 *     summary: Get driver's own status
 *     tags: [Driver]
 *     description: Get current driver status including duty status and active status (Driver only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver status
 *       403:
 *         description: Only drivers can view their status
 *       401:
 *         description: Unauthorized
 */
router.get('/status', driverController.getMyStatus.bind(driverController));

/**
 * @swagger
 * /api/driver/all:
 *   get:
 *     summary: Get all drivers
 *     tags: [Driver]
 *     description: Get list of all drivers (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_on_duty
 *         schema:
 *           type: boolean
 *         description: Filter by duty status
 *       - in: query
 *         name: center_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by center ID
 *     responses:
 *       200:
 *         description: List of drivers
 *       403:
 *         description: Only admin can view all drivers
 *       401:
 *         description: Unauthorized
 */
router.get('/all', driverController.getAllDrivers.bind(driverController));

/**
 * @swagger
 * /api/driver/monthly-duty-statistics:
 *   get:
 *     summary: Get monthly duty statistics for a driver
 *     tags: [Driver]
 *     description: Get monthly duty statistics including on-duty days, leave days for morning and evening shifts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver ID admin can view any driver driver can only view own
 *       - in: query
 *         name: year
 *         description: Year default is current year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         description: Month 1-12 default is current month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Monthly duty statistics
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Unauthorized
 */
router.get('/monthly-duty-statistics', driverController.getMonthlyDutyStatistics.bind(driverController));

export default router;

