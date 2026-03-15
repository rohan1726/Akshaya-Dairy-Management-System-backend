import { MilkCollectionModel, PaymentModel, NotificationModel } from '../models';
import { toApiDoc, toApiDocs } from '../config/database';
import { Payment, PaymentType, PaymentStatus } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export class PaymentService {
  async calculateMonthlyPayment(
    vendorId: string,
    month: Date
  ): Promise<{
    totalMilkAmount: number;
    advanceAmount: number;
    previousPending: number;
    deductions: number;
    finalAmount: number;
  }> {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);

    const collections = await MilkCollectionModel.find({
      vendor_id: vendorId,
      collection_date: { $gte: monthStart, $lte: monthEnd },
      status: { $ne: 'rejected' },
    }).lean();

    const totalMilkAmount = collections.reduce((sum: number, c: { total_amount?: number }) => sum + (c.total_amount || 0), 0);

    const advances = await PaymentModel.find({
      vendor_id: vendorId,
      payment_type: PaymentType.ADVANCE,
      status: PaymentStatus.PAID,
    }).lean();
    const advanceAmount = advances.reduce((sum: number, p: { advance_amount?: number }) => sum + (p.advance_amount || 0), 0);

    const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    const previousMonthEnd = new Date(month.getFullYear(), month.getMonth(), 0, 23, 59, 59, 999);
    const previousPayments = await PaymentModel.find({
      vendor_id: vendorId,
      payment_month: { $gte: previousMonth, $lte: previousMonthEnd },
      status: PaymentStatus.PENDING,
    }).lean();
    const previousPending = previousPayments.reduce((sum: number, p: { final_amount?: number }) => sum + (p.final_amount || 0), 0);

    const deductions = 0;
    const finalAmount = totalMilkAmount - advanceAmount - deductions + previousPending;

    return {
      totalMilkAmount,
      advanceAmount,
      previousPending,
      deductions,
      finalAmount,
    };
  }

  async createPayment(paymentData: {
    vendor_id: string;
    payment_type: PaymentType;
    payment_month?: Date;
    total_amount: number;
    advance_amount?: number;
    previous_pending?: number;
    deductions?: number;
    final_amount: number;
    payment_notes?: string;
    created_by: string;
  }): Promise<Payment> {
    const paymentMonth = paymentData.payment_month
      ? new Date(
          new Date(paymentData.payment_month).getFullYear(),
          new Date(paymentData.payment_month).getMonth(),
          1
        )
      : undefined;

    const paymentCode = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;

    const payment = await PaymentModel.create({
      ...paymentData,
      payment_code: paymentCode,
      payment_month: paymentMonth,
      advance_amount: paymentData.advance_amount ?? 0,
      previous_pending: paymentData.previous_pending ?? 0,
      deductions: paymentData.deductions ?? 0,
      status: PaymentStatus.PENDING,
    });

    await NotificationModel.create({
      user_id: paymentData.vendor_id,
      user_role: 'vendor',
      title: 'Payment Generated',
      message: `Monthly payment of ₹${paymentData.final_amount} has been generated.`,
      type: 'payment_released',
      priority: 'high',
      is_read: false,
      metadata: { payment_id: payment._id.toString() },
    });

    return toApiDoc(payment) as Payment;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    transactionId?: string,
    paymentMethod?: string
  ): Promise<Payment> {
    const updateData: any = { status };
    if (status === PaymentStatus.PAID) {
      updateData.paid_at = new Date();
      updateData.transaction_id = transactionId;
      updateData.payment_method = paymentMethod;
    }

    const payment = await PaymentModel.findByIdAndUpdate(paymentId, updateData, { new: true });
    if (!payment) throw new Error('Payment not found');
    return toApiDoc(payment) as Payment;
  }

  async getPayments(filters: {
    vendor_id?: string;
    payment_month?: Date;
    status?: PaymentStatus;
    limit?: number;
    offset?: number;
  }): Promise<Payment[]> {
    const filter: any = {};
    if (filters.vendor_id) filter.vendor_id = filters.vendor_id;
    if (filters.status) filter.status = filters.status;
    if (filters.payment_month) {
      const m = new Date(filters.payment_month);
      const start = new Date(m.getFullYear(), m.getMonth(), 1);
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999);
      filter.payment_month = { $gte: start, $lte: end };
    }

    let query = PaymentModel.find(filter).sort({ created_at: -1 });
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.skip(filters.offset);
    const payments = await query.lean();
    return toApiDocs(payments as any);
  }
}

export default new PaymentService();
