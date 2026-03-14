import { CenterMilkPriceModel, ActivityLogModel } from '../models';
import { toApiDoc, toApiDocs } from '../config/database';
import { CenterMilkPrice, MilkType } from '../models/types';

export class CenterMilkPriceService {
  async setCenterPrice(priceData: {
    center_id: string;
    price_date: Date;
    milk_type: MilkType;
    base_price: number;
    net_price?: number;
    base_fat: number;
    base_snf: number;
    fat_rate: number;
    snf_rate: number;
    bonus?: number;
    notes?: string;
    created_by: string;
  }): Promise<CenterMilkPrice> {
    const priceDate = new Date(priceData.price_date);
    priceDate.setHours(0, 0, 0, 0);

    const existing = await CenterMilkPriceModel.findOne({
      center_id: priceData.center_id,
      price_date: priceDate,
      milk_type: priceData.milk_type,
    });

    if (existing) {
      const oldBase = existing.base_price;
      const oldNet = existing.net_price;
      existing.base_price = priceData.base_price;
      existing.net_price = priceData.net_price;
      if (oldBase !== priceData.base_price) existing.old_base_price = oldBase;
      if (oldNet != null && oldNet !== priceData.net_price) existing.old_net_price = oldNet;
      existing.base_fat = priceData.base_fat;
      existing.base_snf = priceData.base_snf;
      existing.fat_rate = priceData.fat_rate;
      existing.snf_rate = priceData.snf_rate;
      existing.bonus = priceData.bonus ?? 0;
      existing.notes = priceData.notes;
      existing.modified_by = priceData.created_by;
      await existing.save();

      await ActivityLogModel.create({
        user_id: priceData.created_by,
        action: 'update_center_milk_price',
        entity_type: 'center_milk_price',
        entity_id: existing._id.toString(),
      });
      return toApiDoc(existing) as CenterMilkPrice;
    }

    const newPrice = await CenterMilkPriceModel.create({
      ...priceData,
      price_date: priceDate,
      bonus: priceData.bonus ?? 0,
      is_active: true,
    });

    await ActivityLogModel.create({
      user_id: priceData.created_by,
      action: 'create_center_milk_price',
      entity_type: 'center_milk_price',
      entity_id: newPrice._id.toString(),
    });
    return toApiDoc(newPrice) as CenterMilkPrice;
  }

  async getCenterPrice(centerId: string, date: Date, milkType: MilkType): Promise<CenterMilkPrice | null> {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const price = await CenterMilkPriceModel.findOne({
      center_id: centerId,
      price_date: { $gte: d, $lt: next },
      milk_type: milkType,
      is_active: true,
    }).lean();
    return price ? (toApiDoc(price) as CenterMilkPrice) : null;
  }

  async getCenterPrices(filters: {
    center_id?: string;
    start_date?: Date;
    end_date?: Date;
    milk_type?: MilkType;
  }): Promise<CenterMilkPrice[]> {
    const filter: any = { is_active: true };
    if (filters.center_id) filter.center_id = filters.center_id;
    if (filters.start_date) filter.price_date = { ...filter.price_date, $gte: new Date(filters.start_date) };
    if (filters.end_date) filter.price_date = { ...filter.price_date, $lte: new Date(filters.end_date) };
    if (filters.milk_type) filter.milk_type = filters.milk_type;
    const prices = await CenterMilkPriceModel.find(filter).sort({ price_date: -1, milk_type: 1 }).lean();
    return toApiDocs(prices as any);
  }
}

export default new CenterMilkPriceService();
