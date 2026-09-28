/**
 * SmartDonorRecommendation.test.ts
 * DEV_D - Phase 7 Smart Donor Recommendation Unit Tests
 */

import { SmartDonorRecommendationEngine } from '../services/recommendation/SmartDonorRecommendationEngine.js';
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
  console.log('  RUNNING SMART DONOR RECOMMENDATION TEST SUITE');
  console.log('==================================================\n');

  const engine = new SmartDonorRecommendationEngine();

  // --------------------------------------------------------
  // Test Group 1: Setup Test Donors & Hospital Data
  // --------------------------------------------------------
  console.log('Test Group 1: Test Donor Setup');

  const hospitalLat = 28.5672; // AIIMS Delhi
  const hospitalLon = 77.2100;
  const runId = Date.now();

  // Donor 1: Close (2km), High Reliability (100)
  const donor1 = await prisma.user.create({
    data: {
      id: `rec-donor-close-high-${runId}`,
      name: 'Amit Vikram',
      email: `amit.${runId}@rec.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'O_NEG',
      latitude: 28.5800, // ~2 km
      longitude: 77.2100,
      location_permission: true,
      total_requests_received: 10,
      total_requests_accepted: 10,
      total_completed_donations: 10,
    },
  });

  // Donor 2: Medium Distance (7km), Lower Reliability (75)
  const donor2 = await prisma.user.create({
    data: {
      id: `rec-donor-med-low-${runId}`,
      name: 'Deepak Roy',
      email: `deepak.${runId}@rec.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'O_NEG',
      latitude: 28.6315, // ~7.15 km
      longitude: 77.2167,
      location_permission: true,
      total_requests_received: 0,
      total_requests_accepted: 0,
      total_completed_donations: 0,
    },
  });

  // Donor 3: Far Distance (30km), High Reliability
  const donor3 = await prisma.user.create({
    data: {
      id: `rec-donor-far-${runId}`,
      name: 'Gaurav Sen',
      email: `gaurav.${runId}@rec.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'O_NEG',
      latitude: 28.8000, // ~30 km
      longitude: 77.2100,
      location_permission: true,
      total_requests_received: 5,
      total_requests_accepted: 5,
      total_completed_donations: 5,
    },
  });

  // Donor 4: Nearby Incompatible (1km, B+)
  const donor4 = await prisma.user.create({
    data: {
      id: `rec-donor-incompat-${runId}`,
      name: 'Karan Mehra',
      email: `karan.${runId}@rec.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'B_POS',
      latitude: 28.5700,
      longitude: 77.2100,
      location_permission: true,
    },
  });

  // Donor 5: Nearby Ineligible (1km, O-, donated 10 days ago)
  const donor5 = await prisma.user.create({
    data: {
      id: `rec-donor-ineligible-${runId}`,
      name: 'Manoj Joshi',
      email: `manoj.${runId}@rec.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'O_NEG',
      latitude: 28.5710,
      longitude: 77.2100,
      location_permission: true,
    },
  });

  await prisma.donation.create({
    data: {
      id: `don-recent-rec-${runId}`,
      donor_id: donor5.id,
      units_donated: 1,
      donation_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      status: 'APPROVED',
    },
  });

  assert(donor1 && donor2 && donor3 && donor4 && donor5, 'Test donors created successfully');

  // --------------------------------------------------------
  // Test Group 2: Pipeline Filtering & Recommendation Execution
  // --------------------------------------------------------
  console.log('\nTest Group 2: Pipeline Filtering (Compatibility, Eligibility, Radius)');

  const testDonorIds = [donor1.id, donor2.id, donor3.id, donor4.id, donor5.id];

  const result = await engine.recommendDonors({
    bloodGroup: 'O_NEG',
    latitude: hospitalLat,
    longitude: hospitalLon,
    radiusKm: 10,
    urgency: 'STANDARD',
  });

  const testRecommendations = result.recommendations.filter((r) => testDonorIds.includes(r.donorId));

  assert(result.success === true, 'Recommendation pipeline executed successfully');
  assert(testRecommendations.length === 2, `Exactly 2 donors matched (got ${testRecommendations.length})`);

  const recIds = testRecommendations.map((r) => r.donorId);
  assert(recIds.includes(donor1.id), 'Close high-reliability donor included');
  assert(recIds.includes(donor2.id), 'Medium baseline donor included');
  assert(!recIds.includes(donor3.id), 'Far donor (30km) excluded');
  assert(!recIds.includes(donor4.id), 'Incompatible B+ donor excluded');
  assert(!recIds.includes(donor5.id), 'Ineligible recent donor (<56d) excluded');

  // --------------------------------------------------------
  // Test Group 3: Ranking Order Correctness
  // --------------------------------------------------------
  console.log('\nTest Group 3: Ranking Order Correctness');

  assert(testRecommendations[0].donorId === donor1.id, 'Close, high-reliability donor ranks #1');
  assert(testRecommendations[0].rankingScore > testRecommendations[1].rankingScore, `Rank #1 score (${testRecommendations[0].rankingScore}) > Rank #2 score (${testRecommendations[1].rankingScore})`);

  // --------------------------------------------------------
  // Test Group 4: Explainable Reason Generation
  // --------------------------------------------------------
  console.log('\nTest Group 4: Explainable Reasoning Output');

  const topRec = testRecommendations[0];
  assert(topRec.anonymizedName === 'Amit V.', `Donor name anonymized to '${topRec.anonymizedName}'`);
  assert(topRec.reason.includes('Compatible'), 'Reason includes compatibility');
  assert(topRec.reason.includes('eligible'), 'Reason includes eligibility');
  assert(topRec.reason.includes('km away'), 'Reason includes distance');
  assert(topRec.reason.includes('reliability'), 'Reason includes reliability score');

  // --------------------------------------------------------
  // Test Group 5: Emergency Priority Weighting (URGENT Request)
  // --------------------------------------------------------
  console.log('\nTest Group 5: Emergency Priority Weighting');

  const urgentResult = await engine.recommendDonors({
    bloodGroup: 'O_NEG',
    latitude: hospitalLat,
    longitude: hospitalLon,
    radiusKm: 10,
    urgency: 'URGENT',
  });

  const urgentTestRecs = urgentResult.recommendations.filter((r) => testDonorIds.includes(r.donorId));
  assert(urgentTestRecs[0].donorId === donor1.id, 'High reliability donor maintains #1 rank under URGENT request');
  assert(urgentTestRecs[0].reason.includes('prioritized for urgent request'), 'Reason reflects emergency priority boost');

  // --------------------------------------------------------
  // Test Group 6: No Match Handling
  // --------------------------------------------------------
  console.log('\nTest Group 6: Empty Match Handling');

  const emptyResult = await engine.recommendDonors({
    bloodGroup: 'AB_NEG',
    latitude: 0,
    longitude: 0, // In ocean (no donors)
    radiusKm: 5,
  });

  assert(emptyResult.success === true, 'Empty search returned success response');
  assert(emptyResult.recommendations.length === 0, 'Empty recommendations list returned cleanly');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
