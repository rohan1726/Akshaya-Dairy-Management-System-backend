import {
  DriverModel,
  DriverDutyLogModel,
  DriverLocationModel,
  DriverCenterAssignmentModel,
  DairyCenterModel,
  UserModel,
  NotificationModel,
} from '../models';
import { toApiDoc, toApiDocs } from '../config/database';
import { Driver, DriverLocation } from '../models/types';
import logger from '../utils/logger';

export class DriverService {
  private getCurrentShift(): 'morning' | 'evening' {
    const hour = new Date().getHours();
    return hour < 14 ? 'morning' : 'evening';
  }

  async updateDutyStatus(driverId: string, isOnDuty: boolean, createdBy?: string): Promise<Driver> {
    const driverRecord = await DriverModel.findOne({ driver_id: driverId });
    if (!driverRecord) throw new Error('Driver not found');

    driverRecord.is_on_duty = isOnDuty;
    await driverRecord.save();

    const today = new Date();
    const dutyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const shift = this.getCurrentShift();

    let existingLog = await DriverDutyLogModel.findOne({
      driver_id: driverRecord._id.toString(),
      duty_date: dutyDate,
      shift,
    });

    if (isOnDuty) {
      if (existingLog) {
        existingLog.is_on_duty = true;
        existingLog.duty_started_at = new Date();
        existingLog.modified_by = createdBy;
        await existingLog.save();
      } else {
        await DriverDutyLogModel.create({
          driver_id: driverRecord._id.toString(),
          duty_date: dutyDate,
          shift,
          is_on_duty: true,
          duty_started_at: new Date(),
          created_by: createdBy,
        });
      }
    } else {
      if (existingLog) {
        existingLog.is_on_duty = false;
        existingLog.duty_ended_at = new Date();
        existingLog.modified_by = createdBy;
        await existingLog.save();
      } else {
        await DriverDutyLogModel.create({
          driver_id: driverRecord._id.toString(),
          duty_date: dutyDate,
          shift,
          is_on_duty: false,
          duty_ended_at: new Date(),
          created_by: createdBy,
        });
      }
    }

    await NotificationModel.create({
      user_id: driverId,
      user_role: 'driver',
      title: isOnDuty ? 'Duty Started' : 'Duty Ended',
      message: isOnDuty
        ? `You have started your ${shift} duty. You can now collect milk.`
        : `You have ended your ${shift} duty for today.`,
      type: 'duty_status',
      priority: 'medium',
      is_read: false,
    });

    return toApiDoc(driverRecord) as Driver;
  }

  async saveLocation(locationData: {
    driver_id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    address?: string;
  }): Promise<DriverLocation> {
    const location = await DriverLocationModel.create({
      ...locationData,
      recorded_at: new Date(),
    });
    return toApiDoc(location) as DriverLocation;
  }

  async getCurrentLocation(driverId: string): Promise<DriverLocation | null> {
    const location = await DriverLocationModel.findOne({ driver_id: driverId })
      .sort({ recorded_at: -1 })
      .lean();
    return location ? (toApiDoc(location) as DriverLocation) : null;
  }

  async getLocationHistory(driverId: string, date?: Date): Promise<DriverLocation[]> {
    const filter: any = { driver_id: driverId };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.recorded_at = { $gte: start, $lte: end };
    }
    const locations = await DriverLocationModel.find(filter).sort({ recorded_at: -1 }).limit(100).lean();
    return toApiDocs(locations as any);
  }

  async getDriverById(driverId: string): Promise<Driver | null> {
    const driver = await DriverModel.findOne({ driver_id: driverId }).lean();
    return driver ? (toApiDoc(driver) as Driver) : null;
  }

  async getAssignedCenters(driverId: string): Promise<any[]> {
    const driverRecord = await DriverModel.findOne({ driver_id: driverId });
    if (!driverRecord) return [];
    const assignments = await DriverCenterAssignmentModel.find({
      driver_id: driverRecord._id.toString(),
      is_active: true,
    }).lean();
    const centerIds = assignments.map((a: { center_id: string }) => a.center_id);
    const centers = await DairyCenterModel.find({ _id: { $in: centerIds } }).lean();
    return toApiDocs(centers as any);
  }

  async getAllDrivers(filters: {
    is_on_duty?: boolean;
    center_id?: string;
    is_active?: boolean;
  }): Promise<any[]> {
    const driverFilter: any = {};
    if (filters.is_on_duty !== undefined) driverFilter.is_on_duty = filters.is_on_duty;
    if (filters.center_id) driverFilter.center_id = filters.center_id;

    const drivers = await DriverModel.find(driverFilter).lean();
    const userIds = drivers.map((d: { driver_id: string }) => d.driver_id);
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u: { _id: any; first_name?: string; last_name?: string; mobile_no?: string; email?: string; is_active?: boolean }) => [u._id.toString(), u]));

    let result = drivers.map((d: { driver_id: string; [key: string]: any }) => {
      const u = userMap.get(d.driver_id) as { first_name?: string; last_name?: string; mobile_no?: string; email?: string; is_active?: boolean } | undefined;
      return {
        ...toApiDoc(d),
        first_name: u?.first_name,
        last_name: u?.last_name,
        mobile_no: u?.mobile_no,
        email: u?.email,
        is_active: u?.is_active,
      };
    });

    if (filters.is_active !== undefined) {
      result = result.filter((r: { is_active?: boolean }) => r.is_active === filters.is_active);
    }
    return result;
  }

  async getMonthlyDutyStatistics(
    driverId: string,
    year: number,
    month: number
  ): Promise<{
    totalDays: number;
    morningOnDuty: number;
    eveningOnDuty: number;
    morningLeave: number;
    eveningLeave: number;
    dutyLogs: any[];
  }> {
    const driverRecord = await DriverModel.findOne({ driver_id: driverId });
    if (!driverRecord) throw new Error('Driver not found');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const dutyLogs = await DriverDutyLogModel.find({
      driver_id: driverRecord._id.toString(),
      duty_date: { $gte: startDate, $lte: endDate },
    })
      .sort({ duty_date: 1, shift: 1 })
      .lean();

    const morningOnDuty = dutyLogs.filter((l: { shift: string; is_on_duty: boolean }) => l.shift === 'morning' && l.is_on_duty).length;
    const eveningOnDuty = dutyLogs.filter((l: { shift: string; is_on_duty: boolean }) => l.shift === 'evening' && l.is_on_duty).length;
    const morningLeave = dutyLogs.filter((l: { shift: string; is_on_duty: boolean }) => l.shift === 'morning' && !l.is_on_duty).length;
    const eveningLeave = dutyLogs.filter((l: { shift: string; is_on_duty: boolean }) => l.shift === 'evening' && !l.is_on_duty).length;
    const uniqueDays = new Set(dutyLogs.map((l: { duty_date: Date }) => (l.duty_date as Date).toISOString().split('T')[0]));

    return {
      totalDays: uniqueDays.size,
      morningOnDuty,
      eveningOnDuty,
      morningLeave,
      eveningLeave,
      dutyLogs: toApiDocs(dutyLogs as any),
    };
  }

  async updateDutyStatusByDriverId(
    driverRecordId: string,
    isOnDuty: boolean,
    createdBy?: string
  ): Promise<Driver> {
    const driverRecord = await DriverModel.findById(driverRecordId);
    if (!driverRecord) throw new Error('Driver not found');
    return this.updateDutyStatus(driverRecord.driver_id, isOnDuty, createdBy);
  }
}

export default new DriverService();
