import { Router, Response } from 'express';
import paymentService from '../services/payment.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/types';
import { validate, paymentSchema } from '../utils/validation';
import logger from '../utils/logger';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/payment/calculate:
 *   get:
 *     summary: Calculate monthly payment
 *     tags: [Payments]
 *     description: Calculate monthly payment for a vendor (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Vendor (dairy center) ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Month for calculation (YYYY-MM-DD format)
 *         example: "2025-11-01"
 *     responses:
 *       200:
 *         description: Payment calculation
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
 *                     totalMilkAmount:
 *                       type: number
 *                       example: 50000.00
 *                     advanceAmount:
 *                       type: number
 *                       example: 5000.00
 *                     previousPending:
 *                       type: number
 *                       example: 2000.00
 *                     deductions:
 *                       type: number
 *                       example: 0.00
 *                     finalAmount:
 *                       type: number
 *                       example: 47000.00
 *       400:
 *         description: Missing required parameters
 *       403:
 *         description: Only admin can calculate payments
 *       401:
 *         description: Unauthorized
 */
// Calculate monthly payment
router.get('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Only admin can calculate payments' });
      return;
    }

    const { vendor_id, month } = req.query;
    if (!vendor_id || !month) {
      res.status(400).json({ success: false, message: 'vendor_id and month are required' });
      return;
    }

    const calculation = await paymentService.calculateMonthlyPayment(
      vendor_id as string,
      new Date(month as string)
    );

    res.json({
      success: true,
      data: calculation,
    });
  } catch (error: any) {
    logger.error('Calculate payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate payment',
    });
  }
});

/**
 * @swagger
 * /api/payment:
 *   post:
 *     summary: Create payment
 *     tags: [Payments]
 *     description: Create a new payment record (Admin only)
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
 *               - payment_type
 *               - total_amount
 *               - final_amount
 *             properties:
 *               vendor_id:
 *                 type: string
 *                 format: uuid
 *                 example: "10000000-0000-0000-0000-000000000001"
 *               payment_type:
 *                 type: string
 *                 enum: [monthly_milk, driver_salary, advance, adjustment]
 *                 example: "monthly_milk"
 *               payment_month:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-01"
 *               total_amount:
 *                 type: number
 *                 example: 50000.00
 *               advance_amount:
 *                 type: number
 *                 example: 5000.00
 *                 default: 0
 *               previous_pending:
 *                 type: number
 *                 example: 2000.00
 *                 default: 0
 *               deductions:
 *                 type: number
 *                 example: 0.00
 *                 default: 0
 *               final_amount:
 *                 type: number
 *                 example: 47000.00
 *               payment_notes:
 *                 type: string
 *                 example: "Monthly payment for November 2025"
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Only admin can create payments
 *       401:
 *         description: Unauthorized
 */
// Create payment
router.post('/', validate(paymentSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Only admin can create payments' });
      return;
    }

    const payment = await paymentService.createPayment({
      ...req.body,
      created_by: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment,
    });
  } catch (error: any) {
    logger.error('Create payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create payment',
    });
  }
});

/**
 * @swagger
 * /api/payment:
 *   get:
 *     summary: Get payments
 *     tags: [Payments]
 *     description: Get list of payments with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vendor ID (admin only)
 *       - in: query
 *         name: payment_month
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by payment month
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, paid, cancelled]
 *         description: Filter by payment status
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
 *         description: List of payments
 *       401:
 *         description: Unauthorized
 */
// Get payments
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const filters: any = {};

    // Role-based filtering
    if (req.user.role === UserRole.VENDOR) {
      const { DairyCenterModel } = await import('../models');
      const center = await DairyCenterModel.findOne({ user_id: req.user.userId }).lean();
      if (center) {
        filters.vendor_id = center._id.toString();
      }
    } else if (req.query.vendor_id) {
      filters.vendor_id = req.query.vendor_id as string;
    }

    if (req.query.payment_month) {
      filters.payment_month = new Date(req.query.payment_month as string);
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }

    filters.limit = parseInt(req.query.limit as string) || 50;
    filters.offset = parseInt(req.query.offset as string) || 0;

    const payments = await paymentService.getPayments(filters);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
    });
  }
});

/**
 * @swagger
 * /api/payment/{id}/status:
 *   patch:
 *     summary: Update payment status
 *     tags: [Payments]
 *     description: Update payment status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
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
 *                 enum: [pending, approved, paid, cancelled]
 *                 example: "paid"
 *               transaction_id:
 *                 type: string
 *                 example: "TXN123456789"
 *                 description: Bank transaction ID (required when status is paid)
 *               payment_method:
 *                 type: string
 *                 example: "bank_transfer"
 *                 description: Payment method (cash, bank_transfer, upi, etc.)
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Validation error or payment not found
 *       403:
 *         description: Only admin can update payment status
 *       401:
 *         description: Unauthorized
 */
// Update payment status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Only admin can update payment status' });
      return;
    }

    const { status, transaction_id, payment_method } = req.body;
    const payment = await paymentService.updatePaymentStatus(
      req.params.id,
      status,
      transaction_id,
      payment_method
    );

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment,
    });
  } catch (error: any) {
    logger.error('Update payment status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update payment status',
    });
  }
});

export default router;

