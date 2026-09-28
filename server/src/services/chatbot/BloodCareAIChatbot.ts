/**
 * BloodCareAIChatbot.ts
 * DEV_D - Phase 12 Rule-Bound BloodCare AI Chatbot Service
 *
 * Operational & Administrative AI Assistant for Blood Bank & Emergency Response.
 * Integrates with DonorEligibilityEngine, DemandAnalyticsService, DemandPredictionService,
 * and system records.
 *
 * SAFETY GUARDRAILS:
 * 1. NO medical diagnosis or doctor replacement.
 * 2. NO override of BloodCompatibilityEngine or DonorEligibilityEngine.
 * 3. NO fake inventory or donor data.
 * 4. Automatic redirection to emergency medical hotlines (911/112/108) for emergency medical symptoms.
 * 5. Strict role-based authorization enforcement.
 */

import { prisma } from '../../config/db.js';
import { Role } from '../../types/enums.js';
import { DonorEligibilityEngine } from '../donor/DonorEligibilityEngine.js';
import { DemandAnalyticsService } from '../analytics/DemandAnalyticsService.js';
import { DemandPredictionService } from '../prediction/DemandPredictionService.js';
import { AuditLogger } from '../AuditLogger.js';

export interface ChatbotMessageInput {
  message: string;
  userId: string;
  role: Role;
  hospitalId?: string;
  requestId?: string;
}

export interface ChatbotResponse {
  reply: string;
  suggestions: string[];
  safe: boolean;
  intent: string;
  data?: any;
  emergencyRedirect?: boolean;
}

export class BloodCareAIChatbot {
  private static eligibilityEngine = new DonorEligibilityEngine();

  /**
   * Main entry point to process incoming user messages
   */
  public static async processMessage(input: ChatbotMessageInput): Promise<ChatbotResponse> {
    const rawMsg = (input.message || '').trim();
    const lowerMsg = rawMsg.toLowerCase();
    const { userId, role } = input;

    // Safety check 1: Empty query
    if (!rawMsg) {
      return {
        reply: "Hello! I am BloodCare AI, your operational blood bank assistant. How can I help you today?",
        suggestions: this.getDefaultSuggestions(role),
        safe: true,
        intent: 'GREETING',
      };
    }

    // Safety check 2: Emergency Medical Symptoms Check (All Roles)
    if (this.isEmergencyMedicalQuery(lowerMsg)) {
      await AuditLogger.log('CHATBOT_EMERGENCY_ALERT', userId, `Emergency medical keywords detected: "${rawMsg}"`);
      return {
        reply: "🚨 EMERGENCY MEDICAL ALERT: If you or someone near you is experiencing a medical emergency (such as severe bleeding, chest pain, stroke symptoms, loss of consciousness, or severe injury), please CALL YOUR LOCAL EMERGENCY SERVICES IMMEDIATELY (e.g., 911, 112, or 108) or proceed to the nearest Hospital Emergency Room.\n\nIf you need to initiate an urgent emergency blood requisition for a hospitalized patient, please submit a STAT_CRITICAL blood request in the system immediately.",
        suggestions: ["Submit STAT_CRITICAL Blood Request", "Find Nearby Emergency Hospitals", "Contact Hospital Dispatch"],
        safe: true,
        emergencyRedirect: true,
        intent: 'EMERGENCY_MEDICAL_ALERT',
      };
    }

    // Safety check 3: Medical Diagnosis / Clinical Advice Disclaimer Check
    if (this.isMedicalDiagnosisQuery(lowerMsg)) {
      return {
        reply: "⚕️ MEDICAL ADVICE DISCLAIMER: BloodCare AI is an operational system assistant and CANNOT diagnose medical conditions, interpret lab test results, or prescribe treatments. Please consult a licensed doctor or healthcare professional for personal medical advice.\n\nIf you have administrative questions about blood donation interval eligibility or system blood requests, I am happy to assist!",
        suggestions: ["Check Donation Eligibility", "Blood Request Guide", "Find Nearby Hospitals"],
        safe: true,
        intent: 'MEDICAL_DIAGNOSIS_DISCLAIMER',
      };
    }

    // Process Role-based & Functional Intents
    let response: ChatbotResponse;

    // A. Check for Administrative / Analytics queries from unauthorized roles
    if (this.isAdminOrAnalyticsQuery(lowerMsg) && role !== Role.ADMIN && role !== Role.HOSPITAL) {
      response = {
        reply: "🔒 ACCESS RESTRICTED: Demand analytics, inventory forecasts, and administrative system metrics are restricted to authorized Administrator and Hospital accounts.",
        suggestions: this.getDefaultSuggestions(role),
        safe: true,
        intent: 'UNAUTHORIZED_ACCESS_DENIED',
      };
      await AuditLogger.log('CHATBOT_UNAUTHORIZED_QUERY', userId, `Role ${role} attempted restricted admin query: "${rawMsg}"`);
      return response;
    }

    // B. DONOR Specific & Common Donor Queries
    if (role === Role.DONOR || lowerMsg.includes('eligib') || lowerMsg.includes('can i donate') || lowerMsg.includes('my donation')) {
      if (lowerMsg.includes('eligib') || lowerMsg.includes('can i donate') || lowerMsg.includes('am i eligible') || lowerMsg.includes('waiting period')) {
        response = await this.handleDonorEligibilityQuery(userId);
      } else if (lowerMsg.includes('my donation') || lowerMsg.includes('history') || lowerMsg.includes('past donation') || lowerMsg.includes('donated before')) {
        response = await this.handleDonorHistoryQuery(userId);
      } else if (lowerMsg.includes('process') || lowerMsg.includes('prepare') || lowerMsg.includes('how to donate') || lowerMsg.includes('before donating') || lowerMsg.includes('requirements')) {
        response = this.handleDonationInfoQuery();
      } else if (lowerMsg.includes('where') || lowerMsg.includes('hospital') || lowerMsg.includes('center') || lowerMsg.includes('nearby') || lowerMsg.includes('location')) {
        response = await this.handleNearbyHospitalsQuery();
      } else if (lowerMsg.includes('emergency donation') || lowerMsg.includes('urgent match') || lowerMsg.includes('alert')) {
        response = this.handleEmergencyDonationInfo();
      } else if (role === Role.DONOR) {
        response = await this.handleGenericDonorQuery(lowerMsg, userId);
      }
    }

    // C. PATIENT Specific & Request Queries
    if (!response! && (role === Role.PATIENT || lowerMsg.includes('request') || lowerMsg.includes('status') || lowerMsg.includes('need blood'))) {
      if (
        lowerMsg.includes('how to request') ||
        lowerMsg.includes('how do i request') ||
        lowerMsg.includes('request blood') ||
        lowerMsg.includes('need blood') ||
        lowerMsg.includes('create request') ||
        lowerMsg.includes('apply for blood')
      ) {
        response = this.handlePatientRequestGuidance();
      } else if (lowerMsg.includes('status') || lowerMsg.includes('track') || lowerMsg.includes('my request') || lowerMsg.includes('pending')) {
        response = await this.handlePatientRequestStatus(userId);
      } else if (lowerMsg.includes('process') || lowerMsg.includes('fulfillment') || lowerMsg.includes('how long') || lowerMsg.includes('after request')) {
        response = this.handlePatientProcessGuidance();
      } else if (role === Role.PATIENT) {
        response = await this.handleGenericPatientQuery(lowerMsg, userId);
      }
    }

    // D. HOSPITAL Specific Queries
    if (!response! && (role === Role.HOSPITAL || lowerMsg.includes('stock') || lowerMsg.includes('availability') || lowerMsg.includes('shortage'))) {
      if (lowerMsg.includes('stock') || lowerMsg.includes('availability') || lowerMsg.includes('inventory')) {
        response = await this.handleHospitalInventoryQuery(input.hospitalId);
      } else if (lowerMsg.includes('pending') || lowerMsg.includes('requisition') || lowerMsg.includes('hospital request')) {
        response = await this.handleHospitalPendingRequests(input.hospitalId);
      } else if (lowerMsg.includes('shortage') || lowerMsg.includes('critical stock') || lowerMsg.includes('low')) {
        response = await this.handleHospitalShortageQuery();
      }
    }

    // E. ADMIN Specific Queries
    if (!response! && role === Role.ADMIN) {
      if (lowerMsg.includes('analytics') || lowerMsg.includes('summary') || lowerMsg.includes('metrics')) {
        response = await this.handleAdminDemandAnalytics();
      } else if (lowerMsg.includes('forecast') || lowerMsg.includes('prediction') || lowerMsg.includes('future') || lowerMsg.includes('7 day') || lowerMsg.includes('30 day')) {
        response = await this.handleAdminDemandPrediction();
      } else if (lowerMsg.includes('expiry') || lowerMsg.includes('expired') || lowerMsg.includes('wastage') || lowerMsg.includes('utilization')) {
        response = await this.handleAdminExpiryAnalytics();
      } else if (lowerMsg.includes('emergency') || lowerMsg.includes('critical requests')) {
        response = await this.handleAdminEmergencyStats();
      } else if (lowerMsg.includes('inventory') || lowerMsg.includes('stock')) {
        response = await this.handleAdminInventoryOverview();
      }
    }

    // Fallback: If no specific intent matched
    if (!response!) {
      response = {
        reply: `I am BloodCare AI operational assistant. Based on your role (${role}), here is how I can assist you:`,
        suggestions: this.getDefaultSuggestions(role),
        safe: true,
        intent: 'GENERAL_ASSISTANCE',
      };
    }

    // Log Chatbot Access in AuditLogger
    await AuditLogger.log(
      'CHATBOT_QUERY',
      userId || 'anonymous',
      `Role: ${role} | Intent: ${response.intent} | Query: "${rawMsg.substring(0, 80)}"`
    );

    return response;
  }

  // ============================================================================
  // SAFETY & INTENT MATCHING HELPERS
  // ============================================================================

  private static isEmergencyMedicalQuery(msg: string): boolean {
    const keywords = [
      'bleeding',
      'chest pain',
      'unconscious',
      'heart attack',
      'stroke',
      'dying',
      'severe injury',
      'ambulance',
      'accident',
      'breathless',
      'collapsed',
      '911',
      '112',
      '108',
    ];
    return keywords.some((k) => msg.includes(k));
  }

  private static isMedicalDiagnosisQuery(msg: string): boolean {
    const keywords = [
      'diagnose',
      'what disease',
      'my symptoms',
      'low hemoglobin cause',
      'what medicine',
      'cure for',
      'blood test result',
      'is it dangerous',
      'treatment for',
      'doctor advice',
    ];
    return keywords.some((k) => msg.includes(k));
  }

  private static isAdminOrAnalyticsQuery(msg: string): boolean {
    const keywords = [
      'demand analytics',
      'forecast',
      'prediction',
      'wastage rate',
      'system metrics',
      'all hospital inventory',
      'aggregate statistics',
    ];
    return keywords.some((k) => msg.includes(k));
  }

  private static getDefaultSuggestions(role: Role): string[] {
    switch (role) {
      case Role.DONOR:
        return ['Am I eligible to donate?', 'My donation history', 'Donation process guide', 'Nearby donation centers'];
      case Role.PATIENT:
        return ['How to request blood?', 'Track my request status', 'Blood fulfillment process', 'Nearby hospitals'];
      case Role.HOSPITAL:
        return ['Check blood availability', 'View pending requisitions', 'Shortage warning report', 'Submit urgent request'];
      case Role.ADMIN:
        return ['Demand Analytics Overview', '7-Day Demand Forecast', 'Wastage & Expiry Report', 'Global Inventory Stock'];
      default:
        return ['Check donation eligibility', 'How to request blood', 'Nearby blood banks'];
    }
  }

  // ============================================================================
  // INTENT HANDLERS - DONOR
  // ============================================================================

  private static async handleDonorEligibilityQuery(userId: string): Promise<ChatbotResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return {
        reply: "To check your specific donation eligibility, please make sure you are logged in. In general, whole blood donors must wait at least 56 days (8 weeks) between donations and be in good health.",
        suggestions: ["Donation Guidelines", "Nearby Hospitals"],
        safe: true,
        intent: 'DONOR_ELIGIBILITY_GENERAL',
      };
    }

    const donations = await prisma.donation.findMany({
      where: { donor_id: userId },
      orderBy: { donation_date: 'desc' },
    });

    const donorInput = {
      id: user.id,
      name: user.name,
      email: user.email,
      donations: donations.map((d: any) => ({
        id: d.id,
        donation_date: d.donation_date,
        status: d.status,
      })),
    };

    const evaluation = this.eligibilityEngine.evaluate(donorInput);

    let replyMsg = '';
    if (evaluation.eligible) {
      replyMsg = `✅ ELIGIBILITY STATUS: You are ELIGIBLE to donate blood!\n\nYour last approved donation was on ${evaluation.lastDonationDate || 'N/A (First time donor)'}. Thank you for helping save lives!`;
    } else {
      replyMsg = `⏳ ELIGIBILITY STATUS: ${evaluation.status}\n\n`;
      if (evaluation.reasons && evaluation.reasons.length > 0) {
        replyMsg += `Reason: ${evaluation.reasons[0]}\n`;
      }
      if (evaluation.nextEligibleDate) {
        replyMsg += `Next Eligible Date: ${evaluation.nextEligibleDate} (${evaluation.daysRemaining} days remaining).\n`;
      }
      replyMsg += `\nNote: Routine medical screening (hemoglobin, pulse, blood pressure) will be conducted at the donation center prior to donation.`;
    }

    return {
      reply: replyMsg,
      suggestions: evaluation.eligible ? ['Find Nearby Donation Center', 'Donation Preparation Tips'] : ['Donation Guidelines', 'Track Next Eligible Date'],
      safe: true,
      intent: 'DONOR_ELIGIBILITY_CHECK',
      data: evaluation,
    };
  }

  private static async handleDonorHistoryQuery(userId: string): Promise<ChatbotResponse> {
    const donations = await prisma.donation.findMany({
      where: { donor_id: userId },
      orderBy: { donation_date: 'desc' },
    });

    if (donations.length === 0) {
      return {
        reply: "You have not recorded any blood donations yet. Once you make your first donation, your history and certificates will be available here!",
        suggestions: ['Check Donation Eligibility', 'How Donation Works', 'Find Nearby Hospitals'],
        safe: true,
        intent: 'DONOR_HISTORY_EMPTY',
      };
    }

    const approvedCount = donations.filter((d: any) => d.status === 'APPROVED').length;
    const totalUnits = donations
      .filter((d: any) => d.status === 'APPROVED')
      .reduce((sum: number, d: any) => sum + (Number(d.units_donated) || 1), 0);

    const latest = donations[0];
    const latestDate = new Date(latest.donation_date).toISOString().split('T')[0];

    const reply = `🩸 DONATION HISTORY SUMMARY:\n- Total Completed Donations: ${approvedCount}\n- Total Units Donated: ${totalUnits} units\n- Most Recent Donation: ${latestDate} (${latest.status})\n- Estimated Lives Impacted: ${approvedCount * 3} lives saved!`;

    return {
      reply,
      suggestions: ['Check Next Eligible Date', 'Download Certificate', 'Nearby Donation Centers'],
      safe: true,
      intent: 'DONOR_HISTORY_SUMMARY',
      data: { totalDonations: approvedCount, totalUnits, latestDate },
    };
  }

  private static handleDonationInfoQuery(): ChatbotResponse {
    return {
      reply: "📋 BLOOD DONATION PROCESS & PREPARATION:\n\n1. BEFORE DONATING:\n- Drink plenty of water (at least 16 oz) before your appointment.\n- Eat a healthy, iron-rich meal.\n- Get 7-8 hours of restful sleep.\n- Bring a valid photo ID.\n\n2. DONATION STEPS:\n- Registration & Identity Check\n- Confidential Mini-Physical (Blood Pressure, Hemoglobin test)\n- Donation (Takes ~8-10 minutes)\n- Refreshments & 15-minute rest period.\n\n3. ELIGIBILITY RULES:\n- Whole blood donation interval: 56 days (8 weeks).\n- Age: 18-65 years old.\n- Weight: Minimum 50 kg (110 lbs).",
      suggestions: ['Check My Eligibility', 'Find Nearby Hospitals', 'Emergency Donation Info'],
      safe: true,
      intent: 'DONATION_PROCESS_INFO',
    };
  }

  private static async handleNearbyHospitalsQuery(): Promise<ChatbotResponse> {
    const hospitals = await prisma.hospital.findMany();
    if (hospitals.length === 0) {
      return {
        reply: "No active blood donation centers found in your region currently.",
        suggestions: ['Check Donation Eligibility', 'Blood Donation Info'],
        safe: true,
        intent: 'NEARBY_HOSPITALS_EMPTY',
      };
    }

    let reply = "🏥 VERIFIED BLOOD BANK & DONATION CENTERS:\n\n";
    hospitals.slice(0, 4).forEach((h: any, index: number) => {
      reply += `${index + 1}. ${h.name}\n   Address: ${h.address}\n   Phone: ${h.contact_number}\n\n`;
    });

    return {
      reply,
      suggestions: ['Check My Eligibility', 'Donation Preparation Tips'],
      safe: true,
      intent: 'NEARBY_HOSPITALS_LIST',
      data: hospitals,
    };
  }

  private static handleEmergencyDonationInfo(): ChatbotResponse {
    return {
      reply: "⚡ EMERGENCY DONATION RESPONSE:\nWhen critical blood shortages or STAT_CRITICAL hospital requests occur, our Smart Geo-Matching Engine notifies eligible donors within a 10km service radius based on blood compatibility.\n\nMake sure your donor profile location permission is enabled so you can respond when urgent blood matches are requested!",
      suggestions: ['Check My Eligibility', 'Update Profile Location'],
      safe: true,
      intent: 'EMERGENCY_DONATION_INFO',
    };
  }

  private static async handleGenericDonorQuery(msg: string, userId: string): Promise<ChatbotResponse> {
    return this.handleDonorEligibilityQuery(userId);
  }

  // ============================================================================
  // INTENT HANDLERS - PATIENT
  // ============================================================================

  private static handlePatientRequestGuidance(): ChatbotResponse {
    return {
      reply: "🩸 HOW TO SUBMIT A BLOOD REQUEST:\n\n1. Go to your Patient Dashboard.\n2. Click the '+ New Blood Request' button.\n3. Enter the patient's blood group and required units.\n4. Select the receiving hospital and set urgency:\n   - STANDARD: Routine surgeries/procedures.\n   - URGENT: Needed within 24 hours.\n   - STAT_CRITICAL: Emergency life-support need.\n5. Click Submit. Our system will immediately process FEFO inventory reservation and locate compatible donors.",
      suggestions: ['Track My Request Status', 'Fulfillment Process Info', 'Nearby Hospitals'],
      safe: true,
      intent: 'PATIENT_REQUEST_GUIDANCE',
    };
  }

  private static async handlePatientRequestStatus(userId: string): Promise<ChatbotResponse> {
    const requests = await prisma.bloodRequest.findMany({
      where: { requester_id: userId },
      orderBy: { created_at: 'desc' },
    });

    if (requests.length === 0) {
      return {
        reply: "You have not submitted any blood requests yet. Click 'How to Request Blood' for instructions.",
        suggestions: ['How to Request Blood', 'Nearby Hospitals'],
        safe: true,
        intent: 'PATIENT_REQUEST_STATUS_EMPTY',
      };
    }

    const latest = requests[0];
    const dateStr = new Date(latest.created_at).toISOString().split('T')[0];

    const reply = `📋 YOUR LATEST BLOOD REQUEST STATUS:\n- Request ID: ${latest.id.substring(0, 8)}...\n- Blood Group: ${latest.blood_group}\n- Units Requested: ${latest.units_requested}\n- Hospital: ${latest.hospital_name}\n- Urgency: ${latest.urgency}\n- Current Status: ${latest.status}\n- Submitted On: ${dateStr}`;

    return {
      reply,
      suggestions: ['How to Request Blood', 'Fulfillment Process Info'],
      safe: true,
      intent: 'PATIENT_REQUEST_STATUS',
      data: latest,
    };
  }

  private static handlePatientProcessGuidance(): ChatbotResponse {
    return {
      reply: "⚙️ BLOOD REQUISITION FULFILLMENT PROCESS:\n\n1. COMPATIBILITY CHECK: Our Blood Compatibility Engine identifies safe donor blood groups for the patient.\n2. FEFO DISPATCH: Units are reserved from verified inventory using First-Expired, First-Out protocol.\n3. DONOR MATCHING: If inventory is low, nearby eligible donors are notified via our Smart Geo-Matching Engine.\n4. HOSPITAL DISPATCH: Reserved blood units are dispatched directly to the attending medical team.",
      suggestions: ['Track My Request Status', 'How to Request Blood'],
      safe: true,
      intent: 'PATIENT_PROCESS_GUIDANCE',
    };
  }

  private static async handleGenericPatientQuery(msg: string, userId: string): Promise<ChatbotResponse> {
    return this.handlePatientRequestStatus(userId);
  }

  // ============================================================================
  // INTENT HANDLERS - HOSPITAL
  // ============================================================================

  private static async handleHospitalInventoryQuery(hospitalId?: string): Promise<ChatbotResponse> {
    const inventory = await prisma.bloodInventory.findMany({
      orderBy: { blood_group: 'asc' },
    });

    let reply = "📊 CURRENT BLOOD INVENTORY STOCK:\n\n";
    let totalUnits = 0;
    inventory.forEach((item: any) => {
      const units = item.units_available || 0;
      totalUnits += units;
      const statusBadge = units < 3 ? '🔴 CRITICAL' : units < 8 ? '🟡 LOW' : '🟢 SUFFICIENT';
      reply += `- ${item.blood_group}: ${units} units (${statusBadge})\n`;
    });

    reply += `\nTotal Inventory Available: ${totalUnits} units`;

    return {
      reply,
      suggestions: ['View Pending Requisitions', 'Shortage Warning Report', 'Submit Urgent Request'],
      safe: true,
      intent: 'HOSPITAL_INVENTORY_STOCK',
      data: inventory,
    };
  }

  private static async handleHospitalPendingRequests(hospitalId?: string): Promise<ChatbotResponse> {
    const requests = await prisma.bloodRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { created_at: 'desc' },
    });

    if (requests.length === 0) {
      return {
        reply: "There are currently NO pending unfulfilled blood requisitions for your hospital.",
        suggestions: ['Check Blood Availability', 'Shortage Warning Report'],
        safe: true,
        intent: 'HOSPITAL_PENDING_EMPTY',
      };
    }

    let reply = `📋 PENDING BLOOD REQUISITIONS (${requests.length} pending):\n\n`;
    requests.slice(0, 5).forEach((r: any, idx: number) => {
      reply += `${idx + 1}. [${r.urgency}] ${r.blood_group} - ${r.units_requested} units (${r.hospital_name})\n`;
    });

    return {
      reply,
      suggestions: ['Check Blood Availability', 'Process Emergency Response'],
      safe: true,
      intent: 'HOSPITAL_PENDING_REQUESTS',
      data: requests,
    };
  }

  private static async handleHospitalShortageQuery(): Promise<ChatbotResponse> {
    const shortageAnalytics = await DemandAnalyticsService.getShortageAnalytics();
    const inventory = await prisma.bloodInventory.findMany();

    const lowGroups = inventory.filter((i: any) => (i.units_available || 0) < 5);

    let reply = "⚠️ HOSPITAL SHORTAGE WARNING REPORT:\n\n";
    if (lowGroups.length === 0) {
      reply += "✅ All blood group stock levels are currently above critical buffer thresholds.";
    } else {
      reply += "Critical / Low Stock Blood Groups:\n";
      lowGroups.forEach((g: any) => {
        reply += `- ${g.blood_group}: ${g.units_available || 0} units available\n`;
      });
      reply += "\nRecommended Action: Schedule targeted donor outreach for low-buffer blood groups.";
    }

    return {
      reply,
      suggestions: ['Check Inventory Stock', 'View Demand Forecast'],
      safe: true,
      intent: 'HOSPITAL_SHORTAGE_REPORT',
      data: shortageAnalytics,
    };
  }

  // ============================================================================
  // INTENT HANDLERS - ADMIN
  // ============================================================================

  private static async handleAdminInventoryOverview(): Promise<ChatbotResponse> {
    const inventory = await prisma.bloodInventory.findMany({ orderBy: { blood_group: 'asc' } });
    const totalUnits = inventory.reduce((sum: number, item: any) => sum + (item.units_available || 0), 0);

    let reply = `📦 SYSTEM GLOBAL INVENTORY OVERVIEW (${totalUnits} total units):\n\n`;
    inventory.forEach((i: any) => {
      reply += `- ${i.blood_group}: ${i.units_available} units\n`;
    });

    return {
      reply,
      suggestions: ['Demand Analytics', '7-Day Demand Forecast', 'Wastage Report'],
      safe: true,
      intent: 'ADMIN_INVENTORY_OVERVIEW',
      data: inventory,
    };
  }

  private static async handleAdminDemandAnalytics(): Promise<ChatbotResponse> {
    const summary = await DemandAnalyticsService.getSummaryAnalytics();

    const reply = `📈 DEMAND ANALYTICS SUMMARY:\n- Total Requests: ${summary.total_requests}\n- Emergency Requests: ${summary.emergency_requests}\n- Normal Requests: ${summary.normal_requests}\n- Fulfillment Rate: ${summary.fulfillment_rate_pct}%\n- Total Units Requested: ${summary.total_units_requested}\n- Total Units Fulfilled: ${summary.total_units_fulfilled}`;

    return {
      reply,
      suggestions: ['View Demand Forecast', 'Wastage Report', 'Inventory Overview'],
      safe: true,
      intent: 'ADMIN_DEMAND_ANALYTICS',
      data: summary,
    };
  }

  private static async handleAdminDemandPrediction(): Promise<ChatbotResponse> {
    const forecast7 = await DemandPredictionService.getForecast(7);
    const warnings = await DemandPredictionService.getShortageWarnings();

    const criticalWarnings = warnings.filter((w) => w.shortageRiskLevel === 'CRITICAL');

    let reply = `🔮 DEMAND PREDICTION FORECAST (7-Day Horizon):\n- Confidence Level: ${forecast7.confidenceLevel}\n- Total Forecasted Demand: ${forecast7.totalPredictedUnits} units\n- Daily Average: ${forecast7.dailyAverageUnits} units/day\n- Methodology: ${forecast7.methodology}\n\n`;

    if (criticalWarnings.length > 0) {
      reply += `⚠️ CRITICAL SHORTAGE ALERTS (${criticalWarnings.length} blood groups):\n`;
      criticalWarnings.forEach((w) => {
        reply += `- ${w.bloodGroup}: Deficit of ${w.netDeficitUnits7Days} units (Stock: ${w.currentInventoryUnits}, Forecast 7D: ${w.predicted7DayDemandUnits})\n`;
      });
    } else {
      reply += `✅ No critical 7-day shortages predicted for current inventory levels.`;
    }

    return {
      reply,
      suggestions: ['Demand Analytics', 'Inventory Overview', 'Wastage Report'],
      safe: true,
      intent: 'ADMIN_DEMAND_PREDICTION',
      data: { forecast7, warnings },
    };
  }

  private static async handleAdminExpiryAnalytics(): Promise<ChatbotResponse> {
    const wastage = await DemandAnalyticsService.getWastageAndUtilizationAnalytics();

    const reply = `♻️ WASTAGE & INVENTORY UTILIZATION:\n- Recorded Blood Units: ${wastage.total_blood_units_recorded}\n- Active Available Units: ${wastage.available_units}\n- Expired Units: ${wastage.expired_units}\n- Discarded Units: ${wastage.discarded_units}\n- System Wastage Rate: ${wastage.wastage_rate_pct}%\n- Inventory Utilization Rate: ${wastage.inventory_utilization_rate_pct}%`;

    return {
      reply,
      suggestions: ['Demand Analytics', '7-Day Demand Forecast', 'Global Inventory Stock'],
      safe: true,
      intent: 'ADMIN_EXPIRY_ANALYTICS',
      data: wastage,
    };
  }

  private static async handleAdminEmergencyStats(): Promise<ChatbotResponse> {
    const requests = await prisma.bloodRequest.findMany();
    const critical = requests.filter((r: any) => r.urgency === 'STAT_CRITICAL');
    const urgent = requests.filter((r: any) => r.urgency === 'URGENT');

    const reply = `⚡ EMERGENCY RESPONSE STATISTICS:\n- Total Requisitions: ${requests.length}\n- STAT_CRITICAL Requests: ${critical.length}\n- URGENT Requests: ${urgent.length}\n- Emergency Ratio: ${requests.length > 0 ? Math.round(((critical.length + urgent.length) / requests.length) * 100) : 0}%`;

    return {
      reply,
      suggestions: ['Demand Analytics', 'Demand Forecast', 'Inventory Overview'],
      safe: true,
      intent: 'ADMIN_EMERGENCY_STATS',
      data: { total: requests.length, critical: critical.length, urgent: urgent.length },
    };
  }
}
