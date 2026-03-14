import { Router } from 'express';
import dairyCenterController from '../controllers/dairy-center.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/centers:
 *   post:
 *     summary: Create dairy center
 *     tags: [Dairy Centers]
 *     description: Create a new dairy center with vendor user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dairy_name
 *               - contact_mobile
 *             properties:
 *               dairy_name:
 *                 type: string
 *                 example: "Shinde Dairy Farm"
 *               contact_mobile:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "vendor@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               first_name:
 *                 type: string
 *                 example: "Vikram"
 *               last_name:
 *                 type: string
 *                 example: "Shinde"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *     responses:
 *       201:
 *         description: Dairy center created successfully
 *       403:
 *         description: Only admin can create centers
 */
router.post('/', dairyCenterController.createCenter.bind(dairyCenterController));

/**
 * @swagger
 * /api/centers:
 *   get:
 *     summary: Get all dairy centers
 *     tags: [Dairy Centers]
 *     description: Get list of all dairy centers (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dairy centers
 *       403:
 *         description: Only admin can view all centers
 */
router.get('/', dairyCenterController.getAllCenters.bind(dairyCenterController));

/**
 * @swagger
 * /api/centers/{id}:
 *   get:
 *     summary: Get dairy center by ID
 *     tags: [Dairy Centers]
 *     description: Get details of a specific dairy center
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
 *         description: Dairy center details
 *       404:
 *         description: Center not found
 */
router.get('/:id', dairyCenterController.getCenterById.bind(dairyCenterController));

/**
 * @swagger
 * /api/centers/{id}:
 *   put:
 *     summary: Update dairy center
 *     tags: [Dairy Centers]
 *     description: Update dairy center information (Admin only)
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
 *               dairy_name:
 *                 type: string
 *               contact_mobile:
 *                 type: string
 *               address:
 *                 type: object
 *     responses:
 *       200:
 *         description: Center updated successfully
 *       403:
 *         description: Only admin can update centers
 *       404:
 *         description: Center not found
 */
router.put('/:id', dairyCenterController.updateCenter.bind(dairyCenterController));

/**
 * @swagger
 * /api/centers/{id}/toggle-status:
 *   patch:
 *     summary: Toggle center status
 *     tags: [Dairy Centers]
 *     description: Activate or deactivate a dairy center (Admin only)
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
 *       403:
 *         description: Only admin can toggle status
 *       404:
 *         description: Center not found
 */
router.patch('/:id/toggle-status', dairyCenterController.toggleStatus.bind(dairyCenterController));

export default router;

