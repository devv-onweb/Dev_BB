/**
 * DemandAnalytics.test.ts
 * DEV_D - Phase 10 Blood Demand Analytics Unit Tests
 */

import { DemandAnalyticsService } from '../services/analytics/DemandAnalyticsService.js';
import { prisma } from '../config/db.js';

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
  console.log('  RUNNING BLOOD DEMAND ANALYTICS TEST SUITE');
  console.log('==================================================\n');

  const runId = Date.now();

  // --------------------------------------------------------
  // Test Group 1: Setup Test Database Data
  // --------------------------------------------------------
  console.log('Test Group 1: Test Analytics Data Setup');

  const testHospital1 = await prisma.hospital.create({
    data: {
      id: `hosp-analytics-1-${runId}`,
      name: `City General Hospital ${runId}`,
      address: 'Central Avenue',
      contact_number: '+91-11-20000001',
      emergency_contact: '+91-11-20000002',
    },
  });

  const testHospital2 = await prisma.hospital.create({
    data: {
      id: `hosp-analytics-2-${runId}`,
      name: `St Jude Health ${runId}`,
      address: 'North District',
      contact_number: '+91-11-20000003',
      emergency_contact: '+91-11-20000004',
    },
  });

  const requesterUser = await prisma.user.create({
    data: {
      id: `user-analytics-req-${runId}`,
      name: 'Analytics Requester',
      email: `requester.${runId}@test.com`,
      password_hash: 'hash',
      role: 'PATIENT',
    },
  });

  // Create Blood Requests for Hospital 1
  const req1 = await prisma.bloodRequest.create({
    data: {
      id: `req-ana-1-${runId}`,
      requester_id: requesterUser.id,
      blood_group: 'O_NEG',
      units_requested: 2,
      hospital_name: testHospital1.name,
      hospital_id: testHospital1.id,
      urgency: 'STAT_CRITICAL',
      status: 'FULFILLED',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago (2 hrs fulfillment time)
    },
  });

  const req2 = await prisma.bloodRequest.create({
    data: {
      id: `req-ana-2-${runId}`,
      requester_id: requesterUser.id,
      blood_group: 'A_POS',
      units_requested: 4,
      hospital_name: testHospital1.name,
      hospital_id: testHospital1.id,
      urgency: 'NORMAL',
      status: 'PENDING',
    },
  });

  // Create Blood Request for Hospital 2
  const req3 = await prisma.bloodRequest.create({
    data: {
      id: `req-ana-3-${runId}`,
      requester_id: requesterUser.id,
      blood_group: 'O_NEG',
      units_requested: 1,
      hospital_name: testHospital2.name,
      hospital_id: testHospital2.id,
      urgency: 'URGENT',
      status: 'FULFILLED',
      created_at: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (4 hrs fulfillment time)
    },
  });

  // Create Blood Units (Inventory & Wastage)
  await prisma.bloodUnit.create({
    data: {
      id: `unit-ana-active-${runId}`,
      unit_number: `UNIT-ACT-${runId}`,
      blood_group: 'O_NEG',
      expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'AVAILABLE',
    },
  });

  await prisma.bloodUnit.create({
    data: {
      id: `unit-ana-expired-${runId}`,
      unit_number: `UNIT-EXP-${runId}`,
      blood_group: 'A_POS',
      expiry_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days past expiry
      status: 'EXPIRED',
    },
  });

  assert(testHospital1 && testHospital2 && req1 && req2 && req3, 'Test database records initialized successfully');

  // --------------------------------------------------------
  // Test Group 2: Summary Analytics
  // --------------------------------------------------------
  console.log('\nTest Group 2: Summary Demand Analytics');

  const summaryH1 = await DemandAnalyticsService.getSummaryAnalytics({ hospitalId: testHospital1.id });
  assert(summaryH1.total_requests === 2, `Hospital 1 total requests is 2 (got ${summaryH1.total_requests})`);
  assert(summaryH1.emergency_requests === 1, 'Hospital 1 emergency requests count is 1');
  assert(summaryH1.normal_requests === 1, 'Hospital 1 normal requests count is 1');
  assert(summaryH1.fulfilled_requests === 1, 'Hospital 1 fulfilled count is 1');
  assert(summaryH1.pending_requests === 1, 'Hospital 1 pending count is 1');
  assert(summaryH1.fulfillment_rate_pct === 50, `Hospital 1 fulfillment rate is 50% (got ${summaryH1.fulfillment_rate_pct}%)`);

  // --------------------------------------------------------
  // Test Group 3: Requests by Blood Group Analytics
  // --------------------------------------------------------
  console.log('\nTest Group 3: Demand by Blood Group');

  const bgAnalytics = await DemandAnalyticsService.getByBloodGroupAnalytics({ hospitalId: testHospital1.id });
  const oNegItem = bgAnalytics.find((b) => b.blood_group === 'O_NEG');
  const aPosItem = bgAnalytics.find((b) => b.blood_group === 'A_POS');

  assert(oNegItem !== undefined && oNegItem.total_requests === 1, 'O_NEG requests grouped correctly');
  assert(oNegItem !== undefined && oNegItem.total_units_requested === 2, 'O_NEG total units requested is 2');
  assert(aPosItem !== undefined && aPosItem.total_units_requested === 4, 'A_POS total units requested is 4');

  // --------------------------------------------------------
  // Test Group 4: Requests by Hospital Analytics
  // --------------------------------------------------------
  console.log('\nTest Group 4: Demand by Hospital');

  const hospitalAnalytics = await DemandAnalyticsService.getByHospitalAnalytics();
  const h1Data = hospitalAnalytics.find((h) => h.hospital_id === testHospital1.id);
  const h2Data = hospitalAnalytics.find((h) => h.hospital_id === testHospital2.id);

  assert(h1Data !== undefined && h1Data.total_requests === 2, 'Hospital 1 demand record found with 2 requests');
  assert(h2Data !== undefined && h2Data.total_requests === 1, 'Hospital 2 demand record found with 1 request');

  // --------------------------------------------------------
  // Test Group 5: Fulfillment Analytics & Time Metrics
  // --------------------------------------------------------
  console.log('\nTest Group 5: Fulfillment Time Analytics');

  const fulfillmentH1 = await DemandAnalyticsService.getFulfillmentAnalytics({ hospitalId: testHospital1.id });
  assert(fulfillmentH1.total_fulfilled === 1, 'Hospital 1 fulfilled count is 1');
  assert(fulfillmentH1.average_fulfillment_time_hours === 2, `Average fulfillment time for H1 is ~2.0 hrs (got ${fulfillmentH1.average_fulfillment_time_hours} hrs)`);

  const fulfillmentH2 = await DemandAnalyticsService.getFulfillmentAnalytics({ hospitalId: testHospital2.id });
  assert(fulfillmentH2.average_fulfillment_time_hours === 4, `Average fulfillment time for H2 is ~4.0 hrs (got ${fulfillmentH2.average_fulfillment_time_hours} hrs)`);

  // --------------------------------------------------------
  // Test Group 6: Shortages & Demand vs Supply Analytics
  // --------------------------------------------------------
  console.log('\nTest Group 6: Shortage Frequency & Demand vs Supply');

  const shortageAnalytics = await DemandAnalyticsService.getShortageAnalytics({ hospitalId: testHospital1.id });
  assert(shortageAnalytics.demand_vs_donations.total_units_demanded === 6, `Total units demanded for H1 is 6 (got ${shortageAnalytics.demand_vs_donations.total_units_demanded})`);
  assert(typeof shortageAnalytics.shortage_frequency_pct === 'number', 'Shortage frequency % calculated');

  // --------------------------------------------------------
  // Test Group 7: Wastage & Utilization Analytics
  // --------------------------------------------------------
  console.log('\nTest Group 7: Wastage & Inventory Utilization');

  const wastageResult = await DemandAnalyticsService.getWastageAndUtilizationAnalytics();
  assert(wastageResult.total_blood_units_recorded >= 2, 'Blood units recorded in system');
  assert(wastageResult.expired_units >= 1, 'Expired blood units detected');
  assert(wastageResult.total_wasted_units >= 1, 'Total wasted units computed');
  assert(wastageResult.wastage_rate_pct >= 0, 'Wastage rate % computed');

  // --------------------------------------------------------
  // Test Group 8: Empty Data Handling
  // --------------------------------------------------------
  console.log('\nTest Group 8: Empty Filter Handling');

  const emptySummary = await DemandAnalyticsService.getSummaryAnalytics({ hospitalId: 'non-existent-hosp' });
  assert(emptySummary.total_requests === 0, 'Non-existent hospital returns 0 total requests');
  assert(emptySummary.fulfillment_rate_pct === 0, 'Non-existent hospital returns 0% fulfillment rate without division by zero');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
