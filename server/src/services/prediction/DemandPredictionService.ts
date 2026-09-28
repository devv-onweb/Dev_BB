/**
 * DemandPredictionService.ts
 * DEV_D - Phase 11 Blood Demand Prediction Service
 *
 * Deterministic statistical forecasting engine (Weighted Moving Average + Seasonality + Trend Factor).
 * Computes 7-day & 30-day demand forecasts, blood-group predictions, and shortage warnings.
 *
 * Pluggable architecture designed to support future ML models.
 * NO LLM guesswork. Handles insufficient historical data safely.
 */

import { prisma } from '../../config/db.js';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';

export interface PredictionFilter {
  hospitalId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface DailyForecastPoint {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  predictedUnits: number;
  emergencyPredictedUnits: number;
}

export interface DemandForecastResult {
  status: 'SUCCESS' | 'INSUFFICIENT_DATA';
  horizonDays: number; // 7 or 30
  confidenceLevel: ConfidenceLevel;
  totalPredictedUnits: number;
  totalEmergencyPredictedUnits: number;
  dailyAverageUnits: number;
  historicalDaysAnalyzed: number;
  historicalRequestsAnalyzed: number;
  dailyForecastPoints: DailyForecastPoint[];
  methodology: string;
  message: string;
}

export interface BloodGroupForecastItem {
  bloodGroup: string;
  predictedUnits7Days: number;
  predictedUnits30Days: number;
  historicalSharePct: number;
  currentAvailableUnits: number;
  predictedShortageUnits7Days: number;
  shortageRiskLevel: 'NONE' | 'MODERATE' | 'CRITICAL';
}

export interface ShortageWarningItem {
  bloodGroup: string;
  currentInventoryUnits: number;
  predicted7DayDemandUnits: number;
  predicted30DayDemandUnits: number;
  netDeficitUnits7Days: number;
  shortageRiskLevel: 'NONE' | 'MODERATE' | 'CRITICAL';
  recommendedAction: string;
}

export class DemandPredictionService {
  private static readonly DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  /**
   * Filters blood requests based on hospital and optional date parameters
   */
  private static filterRequests(requests: any[], filter?: PredictionFilter): any[] {
    let list = [...requests];

    if (filter?.hospitalId) {
      list = list.filter(
        (r) =>
          r.hospital_id === filter.hospitalId ||
          r.hospital_name?.toLowerCase().includes(filter.hospitalId!.toLowerCase())
      );
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
   * Evaluates prediction confidence level based on sample size and historical duration
   */
  private static evaluateConfidenceLevel(daysAnalyzed: number, requestsCount: number): ConfidenceLevel {
    if (requestsCount < 3 || daysAnalyzed < 7) {
      return 'INSUFFICIENT_DATA';
    }
    if (daysAnalyzed >= 30 && requestsCount >= 20) {
      return 'HIGH';
    }
    if (daysAnalyzed >= 14 && requestsCount >= 10) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Generates a 7-day or 30-day demand forecast
   */
  public static async getForecast(
    horizonDays: 7 | 30 = 7,
    filter?: PredictionFilter
  ): Promise<DemandForecastResult> {
    const rawRequests = await prisma.bloodRequest.findMany();
    const requests = this.filterRequests(rawRequests, filter);

    if (requests.length < 3) {
      return {
        status: 'INSUFFICIENT_DATA',
        horizonDays,
        confidenceLevel: 'INSUFFICIENT_DATA',
        totalPredictedUnits: 0,
        totalEmergencyPredictedUnits: 0,
        dailyAverageUnits: 0,
        historicalDaysAnalyzed: 0,
        historicalRequestsAnalyzed: requests.length,
        dailyForecastPoints: [],
        methodology: 'Weighted Moving Average + Seasonality Index (Baseline)',
        message: 'Insufficient historical request records to generate a statistical forecast. Minimum 3 requests required.',
      };
    }

    // Determine historical timeframe
    const timestamps = requests.map((r) => new Date(r.created_at).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const now = Date.now();

    const rangeMs = Math.max(7 * 24 * 60 * 60 * 1000, now - minTime);
    const historicalDaysAnalyzed = Math.max(7, Math.ceil(rangeMs / (24 * 60 * 60 * 1000)));

    const confidenceLevel = this.evaluateConfidenceLevel(historicalDaysAnalyzed, requests.length);

    if (confidenceLevel === 'INSUFFICIENT_DATA') {
      return {
        status: 'INSUFFICIENT_DATA',
        horizonDays,
        confidenceLevel: 'INSUFFICIENT_DATA',
        totalPredictedUnits: 0,
        totalEmergencyPredictedUnits: 0,
        dailyAverageUnits: 0,
        historicalDaysAnalyzed,
        historicalRequestsAnalyzed: requests.length,
        dailyForecastPoints: [],
        methodology: 'Weighted Moving Average + Seasonality Index (Baseline)',
        message: 'Insufficient historical request date range. Minimum 7 days of historical records required.',
      };
    }

    // Compute total units requested & emergency units
    let totalUnitsRequested = 0;
    let totalEmergencyUnits = 0;

    // Day-of-week buckets for seasonality
    const dowUnitsMap = [0, 0, 0, 0, 0, 0, 0];
    const dowCountMap = [0, 0, 0, 0, 0, 0, 0];

    for (const r of requests) {
      const units = Number(r.units_requested) || 1;
      totalUnitsRequested += units;

      if (r.urgency === 'URGENT' || r.urgency === 'STAT_CRITICAL') {
        totalEmergencyUnits += units;
      }

      const reqDate = new Date(r.created_at);
      const dow = reqDate.getDay();
      dowUnitsMap[dow] += units;
      dowCountMap[dow] += 1;
    }

    const overallDailyAvg = totalUnitsRequested / historicalDaysAnalyzed;
    const overallEmergencyDailyAvg = totalEmergencyUnits / historicalDaysAnalyzed;

    // Seasonality indices
    const dowSeasonalityIndex = dowUnitsMap.map((units, dow) => {
      const dowAvg = dowCountMap[dow] > 0 ? units / (dowCountMap[dow] || 1) : overallDailyAvg;
      return overallDailyAvg > 0 ? Math.max(0.5, Math.min(1.8, dowAvg / overallDailyAvg)) : 1.0;
    });

    // Recent trend factor (last 7 days vs overall avg)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentRequests = requests.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo);
    const recentUnits = recentRequests.reduce((sum, r) => sum + (Number(r.units_requested) || 1), 0);
    const recentDailyAvg = recentUnits / 7;

    const rawTrendFactor = overallDailyAvg > 0 ? recentDailyAvg / overallDailyAvg : 1.0;
    const trendFactor = Math.max(0.7, Math.min(1.4, rawTrendFactor));

    // Generate daily forecast points
    const points: DailyForecastPoint[] = [];
    let totalPredictedUnits = 0;
    let totalEmergencyPredictedUnits = 0;

    for (let i = 1; i <= horizonDays; i++) {
      const targetDate = new Date(now + i * 24 * 60 * 60 * 1000);
      const dow = targetDate.getDay();
      const seasonIndex = dowSeasonalityIndex[dow];

      const pointPredicted = Math.max(1, Math.round(overallDailyAvg * trendFactor * seasonIndex));
      const pointEmergency = Math.max(0, Math.round(overallEmergencyDailyAvg * trendFactor));

      totalPredictedUnits += pointPredicted;
      totalEmergencyPredictedUnits += pointEmergency;

      points.push({
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek: this.DAYS_OF_WEEK[dow],
        predictedUnits: pointPredicted,
        emergencyPredictedUnits: pointEmergency,
      });
    }

    const dailyAverageUnits = Math.round((totalPredictedUnits / horizonDays) * 10) / 10;

    return {
      status: 'SUCCESS',
      horizonDays,
      confidenceLevel,
      totalPredictedUnits,
      totalEmergencyPredictedUnits,
      dailyAverageUnits,
      historicalDaysAnalyzed,
      historicalRequestsAnalyzed: requests.length,
      dailyForecastPoints: points,
      methodology: 'Weighted Moving Average with Day-of-Week Seasonality & Recent Trend Adjustment',
      message: `${horizonDays}-day statistical demand forecast computed successfully with ${confidenceLevel} confidence.`,
    };
  }

  /**
   * Generates blood group demand forecast (7-day and 30-day)
   */
  public static async getBloodGroupForecast(filter?: PredictionFilter): Promise<BloodGroupForecastItem[]> {
    const forecast7 = await this.getForecast(7, filter);
    const forecast30 = await this.getForecast(30, filter);

    const rawRequests = await prisma.bloodRequest.findMany();
    const requests = this.filterRequests(rawRequests, filter);

    const inventoryList = await prisma.bloodInventory.findMany();
    const inventoryMap: Record<string, number> = {};
    for (const inv of inventoryList) {
      inventoryMap[inv.blood_group] = inv.units_available || 0;
    }

    const bloodGroups = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
    const totalUnitsDemanded = requests.reduce((sum, r) => sum + (Number(r.units_requested) || 1), 0);

    const groupUnitsMap: Record<string, number> = {};
    for (const bg of bloodGroups) groupUnitsMap[bg] = 0;

    for (const r of requests) {
      const bg = r.blood_group || 'O_POS';
      groupUnitsMap[bg] = (groupUnitsMap[bg] || 0) + (Number(r.units_requested) || 1);
    }

    const result: BloodGroupForecastItem[] = [];

    for (const bg of bloodGroups) {
      const share = totalUnitsDemanded > 0 ? groupUnitsMap[bg] / totalUnitsDemanded : 1 / 8;
      const sharePct = Math.round(share * 1000) / 10;

      const pred7 = Math.max(0, Math.round(forecast7.totalPredictedUnits * share));
      const pred30 = Math.max(0, Math.round(forecast30.totalPredictedUnits * share));

      const available = inventoryMap[bg] || 0;
      const shortage7 = Math.max(0, pred7 - available);

      let riskLevel: 'NONE' | 'MODERATE' | 'CRITICAL' = 'NONE';
      if (shortage7 > 0) {
        riskLevel = 'CRITICAL';
      } else if (available < pred7 * 1.2) {
        riskLevel = 'MODERATE';
      }

      result.push({
        bloodGroup: bg,
        predictedUnits7Days: pred7,
        predictedUnits30Days: pred30,
        historicalSharePct: sharePct,
        currentAvailableUnits: available,
        predictedShortageUnits7Days: shortage7,
        shortageRiskLevel: riskLevel,
      });
    }

    return result;
  }

  /**
   * Generates shortage warning alerts and recommended actions
   */
  public static async getShortageWarnings(filter?: PredictionFilter): Promise<ShortageWarningItem[]> {
    const bgForecasts = await this.getBloodGroupForecast(filter);
    const warnings: ShortageWarningItem[] = [];

    for (const bgItem of bgForecasts) {
      const deficit = bgItem.predictedShortageUnits7Days;
      let action = 'Inventory levels healthy. Continue normal monitoring.';

      if (bgItem.shortageRiskLevel === 'CRITICAL') {
        action = `CRITICAL SHORTAGE WARNING: Forecasted 7-day demand (${bgItem.predictedUnits7Days} units) exceeds current stock (${bgItem.currentAvailableUnits} units). Schedule targeted ${bgItem.bloodGroup} donor drive immediately.`;
      } else if (bgItem.shortageRiskLevel === 'MODERATE') {
        action = `MODERATE SHORTAGE RISK: Low buffer for ${bgItem.bloodGroup}. Current stock (${bgItem.currentAvailableUnits} units) close to 7-day predicted demand (${bgItem.predictedUnits7Days} units). Contact eligible donors.`;
      }

      warnings.push({
        bloodGroup: bgItem.bloodGroup,
        currentInventoryUnits: bgItem.currentAvailableUnits,
        predicted7DayDemandUnits: bgItem.predictedUnits7Days,
        predicted30DayDemandUnits: bgItem.predictedUnits30Days,
        netDeficitUnits7Days: deficit,
        shortageRiskLevel: bgItem.shortageRiskLevel,
        recommendedAction: action,
      });
    }

    // Sort by risk severity (CRITICAL first, MODERATE second)
    warnings.sort((a, b) => {
      const riskOrder: Record<string, number> = { CRITICAL: 1, MODERATE: 2, NONE: 3 };
      return riskOrder[a.shortageRiskLevel] - riskOrder[b.shortageRiskLevel];
    });

    return warnings;
  }
}
