import { Router } from 'express';
import milkCollectionAdminController from '../controllers/milk-collection-admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/milk/collections/{id}/status:
 *   patch:
 *     summary: Update milk collection status
 *     tags: [Milk Collections]
 *     description: Update status of a milk collection (Admin only)
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [collected, delivered, processed, rejected]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       403:
 *         description: Only admin can update status
 */
router.patch('/:id/status', milkCollectionAdminController.updateStatus.bind(milkCollectionAdminController));

export default router;

