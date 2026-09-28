/**
 * DonorReliabilityEngine.ts
 * DEV_D - Phase 6 Donor Reliability Score Engine
 *
 * Provides transparent, deterministic, and explainable donor reliability scoring (0-100).
 * Configurable weights for response rate, acceptance rate, successful donation rate,
 * no-show rate, cancellation rate, and recent activity.
 *
 * NO AI/LLM non-deterministic scoring used.
 * NO sensitive demographic data used.
 */

export interface DonorBehaviorHistory {
  id?: string;
  name?: string;
  total_requests_received?: number;
  total_requests_accepted?: number;
  total_completed_donations?: number;
  total_no_shows?: number;
  total_cancellations?: number;
  last_donation_date?: Date | string | null;
  reliability_score?: number | null;
  reliability_last_updated?: Date | string | null;
}

export interface ReliabilityScoringWeights {
  responseRateWeight: number;        // Default 0.25 (25%)
  acceptanceRateWeight: number;      // Default 0.25 (25%)
  successfulDonationWeight: number;  // Default 0.20 (20%)
  noShowInverseWeight: number;       // Default 0.15 (15%)
  cancellationInverseWeight: number; // Default 0.10 (10%)
  recentActivityWeight: number;      // Default 0.05 (5%)
}

export const DEFAULT_RELIABILITY_WEIGHTS: ReliabilityScoringWeights = {
  responseRateWeight: 0.25,
  acceptanceRateWeight: 0.25,
  successfulDonationWeight: 0.20,
  noShowInverseWeight: 0.15,
  cancellationInverseWeight: 0.10,
  recentActivityWeight: 0.05,
};

export interface ReliabilityBreakdown {
  responseRate: number;            // 0 - 100 %
  acceptanceRate: number;          // 0 - 100 %
  successfulDonationRate: number;  // 0 - 100 %
  noShowRate: number;              // 0 - 100 %
  cancellationRate: number;        // 0 - 100 %
  recentActivityScore: number;    // 0 - 100
}

export interface DonorReliabilityResult {
  donorId?: string;
  donorName?: string;
  status: 'ESTABLISHED' | 'INSUFFICIENT_DATA';
  score: number;                   // 0 - 100
  maxScore: 100;
  breakdown: ReliabilityBreakdown;
  scoreExplanation: string[];
  lastUpdated: Date;
}

export class DonorReliabilityEngine {
  private weights: ReliabilityScoringWeights;

  constructor(customWeights?: Partial<ReliabilityScoringWeights>) {
    this.weights = {
      ...DEFAULT_RELIABILITY_WEIGHTS,
      ...customWeights,
    };

    // Normalize weights to sum to 1.0 if customized
    const totalWeight =
      this.weights.responseRateWeight +
      this.weights.acceptanceRateWeight +
      this.weights.successfulDonationWeight +
      this.weights.noShowInverseWeight +
      this.weights.cancellationInverseWeight +
      this.weights.recentActivityWeight;

    if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.001) {
      this.weights.responseRateWeight /= totalWeight;
      this.weights.acceptanceRateWeight /= totalWeight;
      this.weights.successfulDonationWeight /= totalWeight;
      this.weights.noShowInverseWeight /= totalWeight;
      this.weights.cancellationInverseWeight /= totalWeight;
      this.weights.recentActivityWeight /= totalWeight;
    }
  }

  /**
   * Returns current weights configuration
   */
  public getWeights(): ReliabilityScoringWeights {
    return { ...this.weights };
  }

  /**
   * Calculates recent activity score (0 - 100) based on last donation date.
   */
  private calculateRecentActivityScore(lastDonationDate?: Date | string | null, currentDate: Date = new Date()): number {
    if (!lastDonationDate) return 0;
    const lastDate = new Date(lastDonationDate);
    if (isNaN(lastDate.getTime())) return 0;

    const diffDays = Math.max(0, Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));

    if (diffDays <= 90) return 100;
    if (diffDays <= 180) return 75;
    if (diffDays <= 365) return 40;
    return 10;
  }

  /**
   * Evaluates the donor reliability score based on interaction history.
   */
  public evaluateReliability(donor: DonorBehaviorHistory, currentDate: Date = new Date()): DonorReliabilityResult {
    const donorId = donor.id || 'unknown';
    const donorName = donor.name || 'Donor';

    const received = Math.max(0, donor.total_requests_received || 0);
    const accepted = Math.max(0, donor.total_requests_accepted || 0);
    const completed = Math.max(0, donor.total_completed_donations || 0);
    const noShows = Math.max(0, donor.total_no_shows || 0);
    const cancellations = Math.max(0, donor.total_cancellations || 0);

    const explanations: string[] = [];

    // 1. Check Insufficient Data Condition
    if (received === 0 && completed === 0) {
      explanations.push('No historical request notifications or donation records found.');
      explanations.push('Assigned system baseline score of 75/100 (Insufficient Data).');

      return {
        donorId,
        donorName,
        status: 'INSUFFICIENT_DATA',
        score: 75,
        maxScore: 100,
        breakdown: {
          responseRate: 100,
          acceptanceRate: 100,
          successfulDonationRate: 100,
          noShowRate: 0,
          cancellationRate: 0,
          recentActivityScore: 0,
        },
        scoreExplanation: explanations,
        lastUpdated: currentDate,
      };
    }

    // 2. Rates Calculations
    // Response Rate = (accepted + cancellations + noShows) / received * 100
    const respondedCount = accepted + cancellations + noShows;
    const responseRate = received > 0 ? Math.min(100, Math.round((respondedCount / received) * 100)) : 100;

    // Acceptance Rate = accepted / received * 100
    const acceptanceRate = received > 0 ? Math.min(100, Math.round((accepted / received) * 100)) : 100;

    // Successful Donation Rate = completed / accepted * 100 (if accepted > 0 else fallback to completed > 0 ? 100 : 0)
    const successfulDonationRate = accepted > 0 ? Math.min(100, Math.round((completed / accepted) * 100)) : (completed > 0 ? 100 : 80);

    // No-show Rate = noShows / accepted * 100 (or / received if accepted=0)
    const noShowBase = accepted > 0 ? accepted : received;
    const noShowRate = noShowBase > 0 ? Math.min(100, Math.round((noShows / noShowBase) * 100)) : 0;

    // Cancellation Rate = cancellations / received * 100
    const cancellationRate = received > 0 ? Math.min(100, Math.round((cancellations / received) * 100)) : 0;

    // Recent Activity Score
    const recentActivityScore = this.calculateRecentActivityScore(donor.last_donation_date, currentDate);

    // 3. Weighted Score Computation
    const w = this.weights;
    const rawScore =
      responseRate * w.responseRateWeight +
      acceptanceRate * w.acceptanceRateWeight +
      successfulDonationRate * w.successfulDonationWeight +
      (100 - noShowRate) * w.noShowInverseWeight +
      (100 - cancellationRate) * w.cancellationInverseWeight +
      recentActivityScore * w.recentActivityWeight;

    // Clamp score between 0 and 100
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // 4. Generate Explanations
    explanations.push(`Response Rate: ${responseRate}% (${(responseRate * w.responseRateWeight).toFixed(1)} pts)`);
    explanations.push(`Acceptance Rate: ${acceptanceRate}% (${(acceptanceRate * w.acceptanceRateWeight).toFixed(1)} pts)`);
    explanations.push(`Successful Donation Rate: ${successfulDonationRate}% (${(successfulDonationRate * w.successfulDonationWeight).toFixed(1)} pts)`);

    if (noShowRate > 0) {
      explanations.push(`No-show Penalty: -${(noShowRate * w.noShowInverseWeight).toFixed(1)} pts (${noShowRate}% no-shows)`);
    } else {
      explanations.push(`No-show Bonus: +${(100 * w.noShowInverseWeight).toFixed(1)} pts (0% no-shows)`);
    }

    if (cancellationRate > 0) {
      explanations.push(`Cancellation Penalty: -${(cancellationRate * w.cancellationInverseWeight).toFixed(1)} pts (${cancellationRate}% cancellations)`);
    } else {
      explanations.push(`Cancellation Bonus: +${(100 * w.cancellationInverseWeight).toFixed(1)} pts (0% cancellations)`);
    }

    explanations.push(`Recent Activity: ${recentActivityScore}/100 (${(recentActivityScore * w.recentActivityWeight).toFixed(1)} pts)`);

    return {
      donorId,
      donorName,
      status: 'ESTABLISHED',
      score: finalScore,
      maxScore: 100,
      breakdown: {
        responseRate,
        acceptanceRate,
        successfulDonationRate,
        noShowRate,
        cancellationRate,
        recentActivityScore,
      },
      scoreExplanation: explanations,
      lastUpdated: currentDate,
    };
  }
}
