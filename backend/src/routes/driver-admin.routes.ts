import { Router } from 'express';
import driverAdminController from '../controllers/driver-admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/driver-admin:
 *   post:
 *     summary: Create driver
 *     tags: [Driver Management]
 *     description: Create a new driver (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_no
 *               - first_name
 *             properties:
 *               mobile_no:
 *                 type: string
 *                 example: "9876543211"
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 example: "password123"
 *               first_name:
 *                 type: string
 *                 example: "Rajesh"
 *               last_name:
 *                 type: string
 *                 example: "Kumar"
 *               center_id:
 *                 type: string
 *                 format: uuid
 *               license_number:
 *                 type: string
 *                 example: "DL-1234567890"
 *               license_expiry:
 *                 type: string
 *                 format: date
 *               vehicle_number:
 *                 type: string
 *                 example: "MH-12-AB-1234"
 *               vehicle_type:
 *                 type: string
 *                 example: "bike"
 *               salary_per_month:
 *                 type: number
 *                 example: 15000
 *               joining_date:
 *                 type: string
 *                 format: date
 *               emergency_contact_name:
 *                 type: string
 *               emergency_contact_mobile:
 *                 type: string
 *     responses:
 *       201:
 *         description: Driver created successfully
 *       403:
 *         description: Only admin can create drivers
 */
router.post('/', driverAdminController.createDriver.bind(driverAdminController));

/**
 * @swagger
 * /api/driver-admin/{id}:
 *   put:
 *     summary: Update driver
 *     tags: [Driver Management]
 *     description: Update driver information (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *       403:
 *         description: Only admin can update drivers
 */
router.put('/:id', driverAdminController.updateDriver.bind(driverAdminController));

/**
 * @swagger
 * /api/driver-admin/{id}/toggle-duty:
 *   patch:
 *     summary: Toggle driver duty status
 *     tags: [Driver Management]
 *     description: Toggle driver on/off duty (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Duty status toggled successfully
 */
router.patch('/:id/toggle-duty', driverAdminController.toggleDriverDuty.bind(driverAdminController));

/**
 * @swagger
 * /api/driver-admin/{id}/toggle-status:
 *   patch:
 *     summary: Toggle driver active status
 *     tags: [Driver Management]
 *     description: Activate or deactivate driver (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Status toggled successfully
 */
router.patch('/:id/toggle-status', driverAdminController.toggleDriverStatus.bind(driverAdminController));

/**
 * @swagger
 * /api/driver-admin/{id}/assign-center:
 *   post:
 *     summary: Assign center to driver
 *     tags: [Driver Management]
 *     description: Assign or reassign a dairy center to driver (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               center_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Center assigned successfully
 */
router.post('/:id/assign-center', driverAdminController.assignCenter.bind(driverAdminController));

export default router;

