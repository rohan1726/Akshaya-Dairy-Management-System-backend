import { MilkCollectionModel, MilkPriceModel, DairyCenterModel, UserModel, ActivityLogModel } from '../models';
import { toApiDoc, toApiDocs } from '../config/database';
import { MilkCollection, MilkPrice, CollectionTime, MilkType } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import centerMilkPriceService from './center-milk-price.service';

export class MilkService {
  async getTodayPrice(milkType: MilkType = MilkType.MIX_MILK): Promise<MilkPrice | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const price = await MilkPriceModel.findOne({
      price_date: { $gte: today, $lt: tomorrow },
      milk_type: milkType,
      is_active: true,
    }).lean();
    return price ? (toApiDoc(price) as MilkPrice) : null;
  }

  async getCenterPriceWithFallback(
    centerId: string,
    date: Date,
    milkType: MilkType
  ): Promise<MilkPrice | null> {
    const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    const centerPrice = await centerMilkPriceService.getCenterPrice(centerId, validDate, milkType);
    if (centerPrice) {
      return {
        id: centerPrice.id,
        price_date: centerPrice.price_date,
        milk_type: centerPrice.milk_type as MilkType,
        base_price: centerPrice.base_price,
        base_fat: centerPrice.base_fat,
        base_snf: centerPrice.base_snf,
        fat_rate: centerPrice.fat_rate,
        snf_rate: centerPrice.snf_rate,
        bonus: centerPrice.bonus || 0,
        is_active: true,
        notes: centerPrice.notes || null,
        created_at: centerPrice.created_at,
        modified_at: centerPrice.modified_at,
        created_by: centerPrice.created_by || null,
        modified_by: centerPrice.modified_by || null,
      } as MilkPrice;
    }
    const d = new Date(validDate);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const globalPrice = await MilkPriceModel.findOne({
      price_date: { $gte: d, $lt: next },
      milk_type: milkType,
      is_active: true,
    }).lean();
    return globalPrice ? (toApiDoc(globalPrice) as MilkPrice) : null;
  }

  async calculatePrice(
    basePrice: number,
    baseFat: number,
    baseSnf: number,
    fatRate: number,
    snfRate: number,
    bonus: number,
    fatPercentage: number,
    snfPercentage: number
  ): Promise<number> {
    const fatDifference = fatPercentage - baseFat;
    const snfDifference = snfPercentage - baseSnf;
    const rate = basePrice + fatDifference * fatRate + snfDifference * snfRate + bonus;
    return Math.round(rate * 100) / 100;
  }

  async createCollection(collectionData: {
    driver_id?: string;
    center_id: string;
    collection_date: Date;
    collection_time: CollectionTime;
    milk_type: MilkType;
    milk_weight: number;
    fat_percentage?: number;
    snf_percentage?: number;
    rate_per_liter?: number;
    can_number?: string;
    can_weight_kg?: number;
    quality_notes?: string;
    created_by: string;
  }): Promise<MilkCollection> {
    const collectionDate = new Date(collectionData.collection_date);
    collectionDate.setHours(0, 0, 0, 0);

    const existingCollection = await MilkCollectionModel.findOne({
      center_id: collectionData.center_id,
      collection_date: collectionDate,
      collection_time: collectionData.collection_time,
      milk_type: collectionData.milk_type,
    });
    if (existingCollection) {
      throw new Error(
        `Milk collection already exists for this center, date, time and milk type.`
      );
    }

    const vendor_id = collectionData.center_id;
    let ratePerLiter: number;
    let baseValue: number;

    if (collectionData.rate_per_liter !== undefined && collectionData.rate_per_liter !== null) {
      ratePerLiter = collectionData.rate_per_liter;
      const price = await this.getCenterPriceWithFallback(
        collectionData.center_id,
        collectionData.collection_date,
        collectionData.milk_type
      );
      baseValue = price?.base_price ?? ratePerLiter;
    } else {
      let price = await this.getCenterPriceWithFallback(
        collectionData.center_id,
        collectionData.collection_date,
        collectionData.milk_type
      );
      if (!price) {
        const defaultPrices: Record<MilkType, { base_price: number; base_fat: number; base_snf: number; fat_rate: number; snf_rate: number; bonus: number }> = {
          [MilkType.COW]: { base_price: 36, base_fat: 3.5, base_snf: 8.5, fat_rate: 5, snf_rate: 5, bonus: 1 },
          [MilkType.BUFFALO]: { base_price: 51, base_fat: 6, base_snf: 9, fat_rate: 5, snf_rate: 5, bonus: 1 },
          [MilkType.MIX_MILK]: { base_price: 40, base_fat: 4.5, base_snf: 8.75, fat_rate: 5, snf_rate: 5, bonus: 1 },
        };
        const def = defaultPrices[collectionData.milk_type];
        price = {
          id: '', price_date: collectionData.collection_date, milk_type: collectionData.milk_type,
          base_price: def.base_price, base_fat: def.base_fat, base_snf: def.base_snf,
          fat_rate: def.fat_rate, snf_rate: def.snf_rate, bonus: def.bonus, is_active: true,
          notes: undefined, created_at: new Date(), modified_at: new Date(), created_by: undefined, modified_by: undefined,
        } as MilkPrice;
      }
      if (collectionData.fat_percentage != null && (collectionData.fat_percentage < 0 || collectionData.fat_percentage > 100))
        throw new Error('FAT percentage must be between 0 and 100');
      if (collectionData.snf_percentage != null && (collectionData.snf_percentage < 0 || collectionData.snf_percentage > 100))
        throw new Error('SNF percentage must be between 0 and 100');
      ratePerLiter = await this.calculatePrice(
        price.base_price, price.base_fat || 0, price.base_snf || 0,
        price.fat_rate, price.snf_rate, price.bonus || 0,
        collectionData.fat_percentage ?? 0, collectionData.snf_percentage ?? 0
      );
      ratePerLiter = Math.max(ratePerLiter, price.base_price);
      baseValue = price.base_price;
    }

    const totalAmount = Math.round(collectionData.milk_weight * ratePerLiter * 100) / 100;
    const dateStr = new Date(collectionData.collection_date).toISOString().split('T')[0].replace(/-/g, '');
    const collectionCode = `MC-${dateStr}-${uuidv4().substring(0, 8).toUpperCase()}`;

    const collection = await MilkCollectionModel.create({
      ...collectionData,
      driver_id: collectionData.driver_id ?? null,
      vendor_id,
      collection_code: collectionCode,
      base_value: baseValue,
      rate_per_liter: ratePerLiter,
      total_amount: totalAmount,
      fat_percentage: collectionData.fat_percentage ?? null,
      snf_percentage: collectionData.snf_percentage ?? null,
      status: 'collected',
      is_synced: true,
      collected_at: new Date(),
    });

    await ActivityLogModel.create({
      user_id: collectionData.created_by,
      action: 'add_milk',
      entity_type: 'milk_collection',
      entity_id: collection._id.toString(),
      details: { center_id: collectionData.center_id, date: collectionDate, time: collectionData.collection_time },
    });

    return toApiDoc(collection) as MilkCollection;
  }

  async getCollections(filters: {
    center_id?: string;
    driver_id?: string;
    collection_date?: Date | string;
    start_date?: string;
    end_date?: string;
    collection_time?: CollectionTime;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<MilkCollection[]> {
    const filter: any = {};
    if (filters.center_id) filter.center_id = filters.center_id;
    if (filters.driver_id) filter.driver_id = filters.driver_id;
    if (filters.collection_time) filter.collection_time = filters.collection_time;
    if (filters.status) filter.status = filters.status;
    if (filters.start_date && filters.end_date) {
      filter.collection_date = { $gte: new Date(filters.start_date), $lte: new Date(filters.end_date) };
    } else if (filters.collection_date) {
      const d = new Date(filters.collection_date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.collection_date = { $gte: d, $lt: next };
    }

    let query = MilkCollectionModel.find(filter)
      .sort({ center_id: 1, collection_date: -1, collection_time: 1, created_at: -1 });
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.skip(filters.offset);
    const collections = await query.lean();

    const centerIds = [...new Set(collections.map((c: { center_id: string }) => c.center_id))];
    const driverIds = [...new Set(collections.map((c: { driver_id?: string }) => c.driver_id).filter(Boolean))] as string[];
    const centers = await DairyCenterModel.find({ _id: { $in: centerIds } }).lean();
    const users = driverIds.length ? await UserModel.find({ _id: { $in: driverIds } }).lean() : [];
    const centerMap = new Map(centers.map((c: { _id: any; dairy_name?: string }) => [c._id.toString(), c]));
    const userMap = new Map(users.map((u: { _id: any; first_name?: string; last_name?: string }) => [u._id.toString(), u]));

    const result = collections.map((c: { center_id: string; driver_id?: string; [key: string]: any }) => {
      const out = toApiDoc(c);
      const center = centerMap.get(c.center_id) as { dairy_name?: string } | undefined;
      const user = c.driver_id ? (userMap.get(c.driver_id) as { first_name?: string; last_name?: string } | undefined) : null;
      return {
        ...out,
        vendor_name: center?.dairy_name,
        center_name: center?.dairy_name,
        driver_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : null,
      };
    });
    return result as MilkCollection[];
  }

  async getCollectionById(id: string): Promise<MilkCollection | null> {
    const collection = await MilkCollectionModel.findById(id).lean();
    if (!collection) return null;
    const out = toApiDoc(collection) as any;
    const center = await DairyCenterModel.findById(collection.center_id).lean();
    const user = collection.driver_id ? await UserModel.findById(collection.driver_id).lean() : null;
    out.vendor_name = center?.dairy_name;
    out.driver_name = user ? `${(user as any).first_name || ''} ${(user as any).last_name || ''}`.trim() : null;
    return out;
  }

  async updateCollection(
    id: string,
    updateData: {
      fat_percentage?: number;
      snf_percentage?: number;
      rate_per_liter?: number;
      total_amount?: number;
      base_value?: number;
      net_price?: number;
      old_base_price?: number;
      old_net_price?: number;
    },
    modifiedBy: string
  ): Promise<MilkCollection> {
    const existing = await MilkCollectionModel.findById(id);
    if (!existing) throw new Error('Collection not found');

    const updateFields: any = { modified_by: modifiedBy };
    if (updateData.fat_percentage !== undefined) updateFields.fat_percentage = updateData.fat_percentage;
    if (updateData.snf_percentage !== undefined) updateFields.snf_percentage = updateData.snf_percentage;
    if (updateData.rate_per_liter !== undefined) updateFields.rate_per_liter = updateData.rate_per_liter;
    if (updateData.total_amount !== undefined) updateFields.total_amount = updateData.total_amount;
    if (updateData.base_value !== undefined) updateFields.base_value = updateData.base_value;

    Object.assign(existing, updateFields);
    await existing.save();

    await ActivityLogModel.create({
      user_id: modifiedBy,
      action: 'update_milk_collection',
      entity_type: 'milk_collection',
      entity_id: id,
    });
    return toApiDoc(existing) as MilkCollection;
  }

  async getDashboardStats(date?: Date): Promise<{
    todayTotalMilk: number;
    morningMilk: number;
    eveningMilk: number;
    thisMonthMilk: number;
    lastMonthMilk: number;
  }> {
    const targetDate = date || new Date();
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0, 23, 59, 59, 999);

    const [todayDocs, morningDocs, eveningDocs, monthDocs, lastMonthDocs] = await Promise.all([
      MilkCollectionModel.find({ collection_date: { $gte: dateStart, $lte: dateEnd } }).lean(),
      MilkCollectionModel.find({ collection_date: { $gte: dateStart, $lte: dateEnd }, collection_time: 'morning' }).lean(),
      MilkCollectionModel.find({ collection_date: { $gte: dateStart, $lte: dateEnd }, collection_time: 'evening' }).lean(),
      MilkCollectionModel.find({ collection_date: { $gte: startOfMonth, $lte: endOfMonth } }).lean(),
      MilkCollectionModel.find({ collection_date: { $gte: lastMonthStart, $lte: lastMonthEnd } }).lean(),
    ]);

    const sum = (arr: any[]) => arr.reduce((s, d) => s + (d.milk_weight || 0), 0);
    return {
      todayTotalMilk: sum(todayDocs),
      morningMilk: sum(morningDocs),
      eveningMilk: sum(eveningDocs),
      thisMonthMilk: sum(monthDocs),
      lastMonthMilk: sum(lastMonthDocs),
    };
  }
}

export default new MilkService();
