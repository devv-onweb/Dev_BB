/**
 * DemandAnalyticsService.ts
 * DEV_D - Phase 10 Blood Demand Analytics Service
 *
 * Computes deterministic, explainable analytics from real database records.
 * NO dummy/mock data used. NO AI/LLM for calculations.
 */

import { prisma } from '../../config/db.js';

export interface AnalyticsFilter {
  hospitalId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface DemandSummaryResult {
  total_requests: number;
  emergency_requests: number;
  normal_requests: number;
  pending_requests: number;
  approved_requests: number;
  fulfilled_requests: number;
  rejected_requests: number;
  fulfillment_rate_pct: number;
  total_units_requested: number;
  total_units_fulfilled: number;
}

export interface BloodGroupDemandItem {
  blood_group: string;
  total_requests: number;
  emergency_requests: number;
  total_units_requested: number;
  total_units_fulfilled: number;
  fulfillment_rate_pct: number;
}

export interface HospitalDemandItem {
  hospital_id: string;
  hospital_name: string;
  total_requests: number;
  emergency_requests: number;
  total_units_requested: number;
  fulfilled_requests: number;
  fulfillment_rate_pct: number;
}

export interface FulfillmentAnalyticsResult {
  total_fulfilled: number;
  average_fulfillment_time_hours: number;
  min_fulfillment_time_hours: number;
  max_fulfillment_time_hours: number;
  fulfillment_time_by_urgency: {
    emergency_avg_hours: number;
    normal_avg_hours: number;
  };
}

export interface ShortageAnalyticsResult {
  total_shortage_incidents: number;
  shortage_frequency_pct: number;
  demand_vs_donations: {
    total_units_demanded: number;
    total_units_donated: number;
    net_deficit_units: number;
  };
  shortages_by_blood_group: Record<string, number>;
}

export interface WastageUtilizationResult {
  total_blood_units_recorded: number;
  available_units: number;
  reserved_units: number;
  used_units: number;
  expired_units: number;
  discarded_units: number;
  total_wasted_units: number;
  wastage_rate_pct: number;
  inventory_utilization_rate_pct: number;
}

export class DemandAnalyticsService {
  /**
   * Helper to parse and build date / hospital filters for queries
   */
  private static filterRequests(requests: any[], filter?: AnalyticsFilter): any[] {
    let list = [...requests];

    if (filter?.hospitalId) {
      list = list.filter((r) => r.hospital_id === filter.hospitalId || r.hospital_name?.toLowerCase().includes(filter.hospitalId!.toLowerCase()));
    }

    if (filter?.startDate) {
      const start = new Date(filter.startDate);
      if (!isNaN(start.getTime())) {
        list = list.filter((r) => new Date(r.created_at).getTime() >= start.getTime());
      }
    }

    if (filter?.endDate) {
      const end = new Date(filter.endDate);
      if (!isNaN(end.getTime())) {
        list = list.filter((r) => new Date(r.created_at).getTime() <= end.getTime());
      }
    }

    return list;
  }

  /**
   * Summary demand analytics metrics
   */
  public static async getSummaryAnalytics(filter?: AnalyticsFilter): Promise<DemandSummaryResult> {
    const rawRequests = await prisma.bloodRequest.findMany();
    const requests = this.filterRequests(rawRequests, filter);

    const total_requests = requests.length;
    let emergency_requests = 0;
    let normal_requests = 0;
    let pending_requests = 0;
    let approved_requests = 0;
    let fulfilled_requests = 0;
    let rejected_requests = 0;

    let total_units_requested = 0;
    let total_units_fulfilled = 0;

    for (const r of requests) {
      const units = Number(r.units_requested) || 0;
      total_units_requested += units;

      const isEmergency = r.urgency === 'URGENT' || r.urgency === 'STAT_CRITICAL';
      if (isEmergency) emergency_requests++;
      else normal_requests++;

      if (r.status === 'PENDING') pending_requests++;
      else if (r.status === 'APPROVED') approved_requests++;
      else if (r.status === 'FULFILLED') {
        fulfilled_requests++;
        total_units_fulfilled += units;
      } else if (r.status === 'REJECTED' || r.status === 'CANCELLED') {
        rejected_requests++;
      }
    }

    const fulfillment_rate_pct = total_requests > 0 ? Math.round((fulfilled_requests / total_requests) * 1000) / 10 : 0;

    return {
      total_requests,
      emergency_requests,
      normal_requests,
      pending_requests,
      approved_requests,
      fulfilled_requests,
      rejected_requests,
      fulfillment_rate_pct,
      total_units_requested,
      total_units_fulfilled,
    };
  }

  /**
   * Demand metrics grouped by blood group
   */
  public static async getByBloodGroupAnalytics(filter?: AnalyticsFilter): Promise<BloodGroupDemandItem[]> {
    const rawRequests = await prisma.bloodRequest.findMany();
    const requests = this.filterRequests(rawRequests, filter);

    const bloodGroups = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
    const map: Record<string, BloodGroupDemandItem> = {};

    for (const bg of bloodGroups) {
      map[bg] = {
        blood_group: bg,
        total_requests: 0,
        emergency_requests: 0,
        total_units_requested: 0,
        total_units_fulfilled: 0,
        fulfillment_rate_pct: 0,
      };
    }

    for (const r of requests) {
      const bg = r.blood_group || 'O_POS';
      if (!map[bg]) {
        map[bg] = {
          blood_group: bg,
          total_requests: 0,
          emergency_requests: 0,
          total_units_requested: 0,
          total_units_fulfilled: 0,
          fulfillment_rate_pct: 0,
        };
      }

      const item = map[bg];
      const units = Number(r.units_requested) || 0;

      item.total_requests++;
      item.total_units_requested += units;

      if (r.urgency === 'URGENT' || r.urgency === 'STAT_CRITICAL') {
        item.emergency_requests++;
      }

      if (r.status === 'FULFILLED') {
        item.total_units_fulfilled += units;
      }
    }

    for (const bg in map) {
      const item = map[bg];
      item.fulfillment_rate_pct = item.total_requests > 0 ? Math.round((item.total_units_fulfilled / item.total_units_requested) * 1000) / 10 || 0 : 0;
    }

    return Object.values(map);
  }

  /**
   * Demand metrics grouped by hospital
   */
  public static async getByHospitalAnalytics(filter?: AnalyticsFilter): Promise<HospitalDemandItem[]> {
    const rawRequests = await prisma.bloodRequest.findMany();
    const requests = this.filterRequests(rawRequests, filter);
    const hospitals = await prisma.hospital.findMany();

    const hospitalMap: Record<string, HospitalDemandItem> = {};

    // Initialize with partner hospitals
    for (const h of hospitals) {
      hospitalMap[h.id] = {
        hospital_id: h.id,
        hospital_name: h.name,
        total_requests: 0,
        emergency_requests: 0,
        total_units_requested: 0,
        fulfilled_requests: 0,
        fulfillment_rate_pct: 0,
      };
    }

    for (const r of requests) {
      const hId = r.hospital_id || 'legacy-hospital';
      const hName = r.hospital_name || 'Partner Hospital';

      if (!hospitalMap[hId]) {
        hospitalMap[hId] = {
          hospital_id: hId,
          hospital_name: hName,
          total_requests: 0,
          emergency_requests: 0,
          total_units_requested: 0,
          fulfilled_requests: 0,
          fulfillment_rate_pct: 0,
        };
      }

      const item = hospitalMap[hId];
      const units = Number(r.units_requested) || 0;

      item.total_requests++;
      item.total_units_requested += units;

      if (r.urgency === 'URGENT' || r.urgency === 'STAT_CRITICAL') {
        item.emergency_requests++;
      }

      if (r.status === 'FULFILLED') {
        item.fulfilled_requests++;
      }
    }

    for (const id in hospitalMap) {
      const item = hospitalMap[id];
      item.fulfillment_rate_pct = item.total_requests > 0 ? Math.round((item.fulfilled_requests / item.total_requests) * 1000) / 10 : 0;
    }

    return Object.values(hospitalMap).filter((h) => h.total_requests > 0 || filter?.hospitalId);
  }

  /**
   * Fulfillment times and metrics
   */
  public static async getFulfillmentAnalytics(filter?: AnalyticsFilter): Promise<FulfillmentAnalyticsResult> {
    const rawRequests = await prisma.bloodRequest.findMany();
    const requests = this.filterRequests(rawRequests, filter);

    const fulfilled = requests.filter((r) => r.status === 'FULFILLED');
    if (fulfilled.length === 0) {
      return {
        total_fulfilled: 0,
        average_fulfillment_time_hours: 0,
        min_fulfillment_time_hours: 0,
        max_fulfillment_time_hours: 0,
        fulfillment_time_by_urgency: {
          emergency_avg_hours: 0,
          normal_avg_hours: 0,
        },
      };
    }

    let totalHours = 0;
    let minHours = Infinity;
    let maxHours = 0;

    let emergencyHours = 0;
    let emergencyCount = 0;

    let normalHours = 0;
    let normalCount = 0;

    for (const r of fulfilled) {
      const start = new Date(r.created_at).getTime();
      const end = new Date(r.updated_at || r.created_at).getTime();
      const diffHours = Math.max(0.05, Math.round(((end - start) / (1000 * 60 * 60)) * 100) / 100);

      totalHours += diffHours;
      if (diffHours < minHours) minHours = diffHours;
      if (diffHours > maxHours) maxHours = diffHours;

      if (r.urgency === 'URGENT' || r.urgency === 'STAT_CRITICAL') {
        emergencyHours += diffHours;
        emergencyCount++;
      } else {
        normalHours += diffHours;
        normalCount++;
      }
    }

    const average_fulfillment_time_hours = Math.round((totalHours / fulfilled.length) * 100) / 100;
    const emergency_avg_hours = emergencyCount > 0 ? Math.round((emergencyHours / emergencyCount) * 100) / 100 : 0;
    const normal_avg_hours = normalCount > 0 ? Math.round((normalHours / normalCount) * 100) / 100 : 0;

    return {
      total_fulfilled: fulfilled.length,
      average_fulfillment_time_hours,
      min_fulfillment_time_hours: minHours === Infinity ? 0 : minHours,
      max_fulfillment_time_hours: maxHours,
      fulfillment_time_by_urgency: {
        emergency_avg_hours,
        normal_avg_hours,
      },
    };
  }

  /**
   * Shortages analytics & Demand vs Supply/Donations
   */
  public static async getShortageAnalytics(filter?: AnalyticsFilter): Promise<ShortageAnalyticsResult> {
    const rawRequests = await prisma.bloodRequest.findMany();
    const requests = this.filterRequests(rawRequests, filter);

    const donations = await prisma.donation.findMany();
    const approvedDonations = donations.filter((d: any) => d.status === 'APPROVED');
    const total_units_donated = approvedDonations.reduce((sum: number, d: any) => sum + (Number(d.units_donated) || 1), 0);

    const inventoryList = await prisma.bloodInventory.findMany();
    const inventoryMap: Record<string, number> = {};
    for (const inv of inventoryList) {
      inventoryMap[inv.blood_group] = inv.units_available || 0;
    }

    let total_units_demanded = 0;
    let total_shortage_incidents = 0;
    const shortages_by_blood_group: Record<string, number> = {};

    for (const r of requests) {
      const units = Number(r.units_requested) || 1;
      total_units_demanded += units;

      const avail = inventoryMap[r.blood_group] || 0;
      if (units > avail) {
        total_shortage_incidents++;
        shortages_by_blood_group[r.blood_group] = (shortages_by_blood_group[r.blood_group] || 0) + 1;
      }
    }

    const shortage_frequency_pct = requests.length > 0 ? Math.round((total_shortage_incidents / requests.length) * 1000) / 10 : 0;
    const net_deficit_units = Math.max(0, total_units_demanded - total_units_donated);

    return {
      total_shortage_incidents,
      shortage_frequency_pct,
      demand_vs_donations: {
        total_units_demanded,
        total_units_donated,
        net_deficit_units,
      },
      shortages_by_blood_group,
    };
  }

  /**
   * Wastage & Inventory Utilization analytics
   */
  public static async getWastageAndUtilizationAnalytics(filter?: AnalyticsFilter): Promise<WastageUtilizationResult> {
    const units = await prisma.bloodUnit.findMany();

    let available_units = 0;
    let reserved_units = 0;
    let used_units = 0;
    let expired_units = 0;
    let discarded_units = 0;

    const now = new Date();

    for (const u of units) {
      const status = u.status ? u.status.toUpperCase() : 'AVAILABLE';
      const isExpiredDate = new Date(u.expiry_date).getTime() < now.getTime();

      if (status === 'EXPIRED' || isExpiredDate) {
        expired_units++;
      } else if (status === 'DISCARDED') {
        discarded_units++;
      } else if (status === 'RESERVED') {
        reserved_units++;
      } else if (status === 'USED') {
        used_units++;
      } else {
        available_units++;
      }
    }

    const total_blood_units_recorded = units.length;
    const total_wasted_units = expired_units + discarded_units;

    const wastage_rate_pct = total_blood_units_recorded > 0 ? Math.round((total_wasted_units / total_blood_units_recorded) * 1000) / 10 : 0;
    const inventory_utilization_rate_pct = total_blood_units_recorded > 0 ? Math.round(((used_units + reserved_units) / total_blood_units_recorded) * 1000) / 10 : 0;

    return {
      total_blood_units_recorded,
      available_units,
      reserved_units,
      used_units,
      expired_units,
      discarded_units,
      total_wasted_units,
      wastage_rate_pct,
      inventory_utilization_rate_pct,
    };
  }
}
