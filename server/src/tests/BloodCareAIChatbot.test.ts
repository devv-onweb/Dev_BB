/**
 * BloodCareAIChatbot.test.ts
 * DEV_D - Phase 12 AI Chatbot Unit Tests
 */

import { BloodCareAIChatbot } from '../services/chatbot/BloodCareAIChatbot.js';
import { Role } from '../types/enums.js';
import { prisma } from '../config/db.js';
import { AuditLogger } from '../services/AuditLogger.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('  RUNNING BLOODCARE AI CHATBOT TEST SUITE');
  console.log('==================================================\n');

  const runId = Date.now();

  // --------------------------------------------------------
  // Test Group 1: Safety & Emergency Medical Hotlines
  // --------------------------------------------------------
  console.log('Test Group 1: Safety & Emergency Medical Hotlines');

  const emergencyRes = await BloodCareAIChatbot.processMessage({
    message: 'The patient has severe bleeding and chest pain after an accident',
    userId: `donor-${runId}`,
    role: Role.DONOR,
  });

  assert(emergencyRes.safe === true, 'Emergency response marked as safe');
  assert(emergencyRes.emergencyRedirect === true, 'Emergency redirect flag set to true');
  assert(emergencyRes.intent === 'EMERGENCY_MEDICAL_ALERT', 'Intent set to EMERGENCY_MEDICAL_ALERT');
  assert(
    emergencyRes.reply.includes('CALL YOUR LOCAL EMERGENCY SERVICES IMMEDIATELY') || emergencyRes.reply.includes('911'),
    'Directs user to emergency services hotlines'
  );

  // --------------------------------------------------------
  // Test Group 2: Medical Diagnosis & Symptom Disclaimer
  // --------------------------------------------------------
  console.log('\nTest Group 2: Medical Diagnosis & Symptom Disclaimer');

  const diagRes = await BloodCareAIChatbot.processMessage({
    message: 'What medicine should I take for low hemoglobin and diagnose my fever?',
    userId: `patient-${runId}`,
    role: Role.PATIENT,
  });

  assert(diagRes.safe === true, 'Medical advice disclaimer response marked as safe');
  assert(diagRes.intent === 'MEDICAL_DIAGNOSIS_DISCLAIMER', 'Intent classified as MEDICAL_DIAGNOSIS_DISCLAIMER');
  assert(
    diagRes.reply.includes('CANNOT diagnose medical conditions') || diagRes.reply.includes('medical advice'),
    'Refuses medical diagnosis and advises consulting a licensed doctor'
  );

  // --------------------------------------------------------
  // Test Group 3: Role-Based Authorization Enforcement
  // --------------------------------------------------------
  console.log('\nTest Group 3: Role-Based Authorization Enforcement');

  const unauthRes = await BloodCareAIChatbot.processMessage({
    message: 'Show me all hospital inventory demand analytics and 30 day forecast',
    userId: `donor-${runId}`,
    role: Role.DONOR,
  });

  assert(unauthRes.safe === true, 'Unauthorized access attempt handled safely');
  assert(unauthRes.intent === 'UNAUTHORIZED_ACCESS_DENIED', 'Intent set to UNAUTHORIZED_ACCESS_DENIED');
  assert(unauthRes.reply.includes('ACCESS RESTRICTED'), 'Returns access restriction message for donor attempting admin query');

  // --------------------------------------------------------
  // Test Group 4: Setup Real Test Data (Donor, Patient, Hospital, Donations, Requests)
  // --------------------------------------------------------
  console.log('\nTest Group 4: Setup Test Data');

  const testDonor = await prisma.user.create({
    data: {
      id: `bot-donor-${runId}`,
      name: 'Chatbot Test Donor',
      email: `bot.donor.${runId}@test.com`,
      password_hash: 'hash',
      role: Role.DONOR,
      blood_group: 'O_NEG',
    },
  });

  const testDonation = await prisma.donation.create({
    data: {
      id: `bot-don-${runId}`,
      donor_id: testDonor.id,
      units_donated: 1,
      donation_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago -> eligible
      status: 'APPROVED',
    },
  });

  const testPatient = await prisma.user.create({
    data: {
      id: `bot-patient-${runId}`,
      name: 'Chatbot Test Patient',
      email: `bot.patient.${runId}@test.com`,
      password_hash: 'hash',
      role: Role.PATIENT,
    },
  });

  const testRequest = await prisma.bloodRequest.create({
    data: {
      id: `bot-req-${runId}`,
      requester_id: testPatient.id,
      blood_group: 'A_POS',
      units_requested: 2,
      hospital_name: 'City General Hospital',
      urgency: 'URGENT',
      status: 'PENDING',
    },
  });

  assert(testDonor && testDonation && testPatient && testRequest, 'Test donor, donation, patient, and request records created');

  // --------------------------------------------------------
  // Test Group 5: DONOR Queries (Eligibility & History)
  // --------------------------------------------------------
  console.log('\nTest Group 5: DONOR Queries (Eligibility & History)');

  const eligRes = await BloodCareAIChatbot.processMessage({
    message: 'Am I eligible to donate blood?',
    userId: testDonor.id,
    role: Role.DONOR,
  });

  assert(eligRes.safe === true, 'Eligibility query response is safe');
  assert(eligRes.intent === 'DONOR_ELIGIBILITY_CHECK', 'Intent identified as DONOR_ELIGIBILITY_CHECK');
  assert(eligRes.reply.includes('ELIGIBLE'), `Returns real eligibility status (got: ${eligRes.reply})`);
  assert(eligRes.data && eligRes.data.eligible === true, 'Eligibility data confirms eligible status');

  const historyRes = await BloodCareAIChatbot.processMessage({
    message: 'Show my donation history',
    userId: testDonor.id,
    role: Role.DONOR,
  });

  assert(historyRes.intent === 'DONOR_HISTORY_SUMMARY', 'Intent identified as DONOR_HISTORY_SUMMARY');
  assert(historyRes.reply.includes('Total Completed Donations: 1'), 'Returns correct donation count from DB');

  // --------------------------------------------------------
  // Test Group 6: PATIENT Queries (Guidance & Request Status)
  // --------------------------------------------------------
  console.log('\nTest Group 6: PATIENT Queries (Guidance & Request Status)');

  const reqGuideRes = await BloodCareAIChatbot.processMessage({
    message: 'How do I request blood for a surgery?',
    userId: testPatient.id,
    role: Role.PATIENT,
  });

  assert(reqGuideRes.intent === 'PATIENT_REQUEST_GUIDANCE', 'Intent identified as PATIENT_REQUEST_GUIDANCE');
  assert(reqGuideRes.reply.includes('HOW TO SUBMIT A BLOOD REQUEST'), 'Returns step-by-step request instructions');

  const statusRes = await BloodCareAIChatbot.processMessage({
    message: 'Track my request status',
    userId: testPatient.id,
    role: Role.PATIENT,
  });

  assert(statusRes.intent === 'PATIENT_REQUEST_STATUS', 'Intent identified as PATIENT_REQUEST_STATUS');
  assert(statusRes.reply.includes('A_POS'), 'Returns active request blood group A_POS from DB');
  assert(statusRes.reply.includes('PENDING'), 'Returns active request status PENDING from DB');

  // --------------------------------------------------------
  // Test Group 7: HOSPITAL Queries (Stock & Pending Requisitions)
  // --------------------------------------------------------
  console.log('\nTest Group 7: HOSPITAL Queries (Stock & Pending Requisitions)');

  const stockRes = await BloodCareAIChatbot.processMessage({
    message: 'Check current inventory stock availability',
    userId: `hosp-user-${runId}`,
    role: Role.HOSPITAL,
  });

  assert(stockRes.intent === 'HOSPITAL_INVENTORY_STOCK', 'Intent identified as HOSPITAL_INVENTORY_STOCK');
  assert(stockRes.reply.includes('CURRENT BLOOD INVENTORY STOCK'), 'Returns blood inventory breakdown');

  const pendingRes = await BloodCareAIChatbot.processMessage({
    message: 'View pending requisitions',
    userId: `hosp-user-${runId}`,
    role: Role.HOSPITAL,
  });

  assert(pendingRes.intent === 'HOSPITAL_PENDING_REQUESTS', 'Intent identified as HOSPITAL_PENDING_REQUESTS');
  assert(pendingRes.reply.includes('PENDING BLOOD REQUISITIONS'), 'Returns pending requisitions list');

  // --------------------------------------------------------
  // Test Group 8: ADMIN Queries (Demand Analytics & Predictions)
  // --------------------------------------------------------
  console.log('\nTest Group 8: ADMIN Queries (Demand Analytics & Predictions)');

  const adminAnalyticsRes = await BloodCareAIChatbot.processMessage({
    message: 'Show demand analytics metrics overview',
    userId: `admin-${runId}`,
    role: Role.ADMIN,
  });

  assert(adminAnalyticsRes.intent === 'ADMIN_DEMAND_ANALYTICS', 'Intent identified as ADMIN_DEMAND_ANALYTICS');
  assert(adminAnalyticsRes.reply.includes('DEMAND ANALYTICS SUMMARY'), 'Returns demand analytics summary from service');

  const adminForecastRes = await BloodCareAIChatbot.processMessage({
    message: 'Show 7 day demand prediction forecast',
    userId: `admin-${runId}`,
    role: Role.ADMIN,
  });

  assert(adminForecastRes.intent === 'ADMIN_DEMAND_PREDICTION', 'Intent identified as ADMIN_DEMAND_PREDICTION');
  assert(adminForecastRes.reply.includes('DEMAND PREDICTION FORECAST'), 'Returns prediction forecast from service');

  // --------------------------------------------------------
  // Test Group 9: Audit Logger Verification
  // --------------------------------------------------------
  console.log('\nTest Group 9: Audit Logger Verification');

  const logs = AuditLogger.getLogs();
  const chatbotLog = logs.find((l) => l.action === 'CHATBOT_QUERY' && l.userId === testDonor.id);

  assert(chatbotLog !== undefined, 'Chatbot query logged successfully in AuditLogger');

  // --------------------------------------------------------
  // Test Group 10: Empty & Ambiguous Messages
  // --------------------------------------------------------
  console.log('\nTest Group 10: Empty & Ambiguous Messages');

  const emptyRes = await BloodCareAIChatbot.processMessage({
    message: '',
    userId: testDonor.id,
    role: Role.DONOR,
  });

  assert(emptyRes.safe === true, 'Empty message handled safely');
  assert(emptyRes.intent === 'GREETING', 'Empty message returns GREETING intent');
  assert(emptyRes.suggestions.length > 0, 'Returns suggestions for empty message');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
