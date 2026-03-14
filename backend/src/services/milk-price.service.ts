import { MilkPriceModel, ActivityLogModel, NotificationModel } from '../models';
import { toApiDoc, toApiDocs } from '../config/database';
import { MilkPrice, MilkType } from '../models/types';

export class MilkPriceService {
  async setDailyPrice(priceData: {
    price_date: Date;
    base_price: number;
    base_fat: number;
    base_snf: number;
    fat_rate: number;
    snf_rate: number;
    bonus: number;
    milk_type: MilkType;
    notes?: string;
    created_by: string;
  }): Promise<MilkPrice> {
    const priceDate = new Date(priceData.price_date);
    priceDate.setHours(0, 0, 0, 0);

    const existing = await MilkPriceModel.findOne({
      price_date: priceDate,
      milk_type: priceData.milk_type,
    });

    if (existing) {
      const oldValues = existing.toObject();
      existing.base_price = priceData.base_price;
      existing.base_fat = priceData.base_fat;
      existing.base_snf = priceData.base_snf;
      existing.fat_rate = priceData.fat_rate;
      existing.snf_rate = priceData.snf_rate;
      existing.bonus = priceData.bonus;
      existing.notes = priceData.notes;
      existing.modified_by = priceData.created_by;
      await existing.save();

      await ActivityLogModel.create({
        user_id: priceData.created_by,
        action: 'update_milk_price',
        entity_type: 'milk_price',
        entity_id: existing._id.toString(),
        old_values: oldValues,
        new_values: existing.toObject(),
      });
      return toApiDoc(existing) as MilkPrice;
    }

    const newPrice = await MilkPriceModel.create({
      ...priceData,
      price_date: priceDate,
      is_active: true,
    });

    await ActivityLogModel.create({
      user_id: priceData.created_by,
      action: 'create_milk_price',
      entity_type: 'milk_price',
      entity_id: newPrice._id.toString(),
      new_values: newPrice.toObject(),
    });

    await NotificationModel.create({
      user_role: 'all',
      title: 'Milk Rate Updated',
      message: `Today's ${priceData.milk_type} milk rate has been updated. Base: ₹${priceData.base_price}, FAT: ${priceData.base_fat}%, SNF: ${priceData.base_snf}%`,
      type: 'rate_update',
      priority: 'high',
      is_read: false,
    });

    return toApiDoc(newPrice) as MilkPrice;
  }

  async getPrice(date: Date, milkType: MilkType): Promise<MilkPrice | null> {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const price = await MilkPriceModel.findOne({
      price_date: { $gte: d, $lt: next },
      milk_type: milkType,
      is_active: true,
    }).lean();
    return price ? (toApiDoc(price) as MilkPrice) : null;
  }

  async getPrices(filters: {
    start_date?: Date;
    end_date?: Date;
    milk_type?: MilkType;
    limit?: number;
    offset?: number;
  }): Promise<MilkPrice[]> {
    const filter: any = { is_active: true };
    if (filters.start_date) filter.price_date = { ...filter.price_date, $gte: new Date(filters.start_date) };
    if (filters.end_date) filter.price_date = { ...filter.price_date, $lte: new Date(filters.end_date) };
    if (filters.milk_type) filter.milk_type = filters.milk_type;

    let query = MilkPriceModel.find(filter).sort({ price_date: -1, milk_type: 1 });
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.skip(filters.offset);
    const prices = await query.lean();
    return toApiDocs(prices as any);
  }

  async calculatePricePreview(
    milkType: MilkType,
    fatPercentage: number,
    snfPercentage: number,
    date?: Date
  ): Promise<{ rate: number; price: MilkPrice }> {
    const targetDate = date || new Date();
    const price = await this.getPrice(targetDate, milkType);
    if (!price) throw new Error(`Milk price not set for ${milkType} on ${targetDate.toISOString().split('T')[0]}`);

    const fatDiff = fatPercentage - (price.base_fat || 0);
    const snfDiff = snfPercentage - (price.base_snf || 0);
    const rate = price.base_price + fatDiff * price.fat_rate + snfDiff * price.snf_rate + (price.bonus || 0);
    return { rate: Math.round(rate * 100) / 100, price };
  }
}

export default new MilkPriceService();
