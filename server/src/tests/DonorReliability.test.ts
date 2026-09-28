/**
 * DonorReliability.test.ts
 * DEV_D - Phase 6 Donor Reliability Score Unit Tests
 */

import { DonorReliabilityEngine, DEFAULT_RELIABILITY_WEIGHTS } from '../services/donor/DonorReliabilityEngine.js';
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
  console.log('  RUNNING DONOR RELIABILITY SCORE TEST SUITE');
  console.log('==================================================\n');

  const engine = new DonorReliabilityEngine();

  // --------------------------------------------------------
  // Test Group 1: New Donor (Insufficient Data Baseline)
  // --------------------------------------------------------
  console.log('Test Group 1: New Donor with Insufficient Data');

  const newDonorResult = engine.evaluateReliability({
    id: 'rel-donor-new',
    name: 'New Registered Donor',
    total_requests_received: 0,
    total_requests_accepted: 0,
    total_completed_donations: 0,
    total_no_shows: 0,
    total_cancellations: 0,
  });

  assert(newDonorResult.status === 'INSUFFICIENT_DATA', 'New donor status is INSUFFICIENT_DATA');
  assert(newDonorResult.score === 75, 'New donor assigned default safe baseline score of 75/100');
  assert(newDonorResult.scoreExplanation.length > 0, 'Explanation provided for baseline score');

  // --------------------------------------------------------
  // Test Group 2: Perfect Donor History (High Score)
  // --------------------------------------------------------
  console.log('\nTest Group 2: Perfect Donor History');

  const perfectDonorResult = engine.evaluateReliability({
    id: 'rel-donor-perfect',
    name: 'Perfect Donor',
    total_requests_received: 10,
    total_requests_accepted: 10,
    total_completed_donations: 10,
    total_no_shows: 0,
    total_cancellations: 0,
    last_donation_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
  });

  assert(perfectDonorResult.status === 'ESTABLISHED', 'Status is ESTABLISHED');
  assert(perfectDonorResult.score >= 95, `Perfect donor score is >= 95 (got ${perfectDonorResult.score})`);
  assert(perfectDonorResult.breakdown.responseRate === 100, 'Response rate is 100%');
  assert(perfectDonorResult.breakdown.acceptanceRate === 100, 'Acceptance rate is 100%');
  assert(perfectDonorResult.breakdown.noShowRate === 0, 'No-show rate is 0%');

  // --------------------------------------------------------
  // Test Group 3: Poor History Donor (Low Score & Penalties)
  // --------------------------------------------------------
  console.log('\nTest Group 3: Poor Donor History (High No-Shows / Cancellations)');

  const poorDonorResult = engine.evaluateReliability({
    id: 'rel-donor-poor',
    name: 'Unreliable Donor',
    total_requests_received: 10,
    total_requests_accepted: 5,
    total_completed_donations: 0,
    total_no_shows: 5,
    total_cancellations: 5,
    last_donation_date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
  });

  assert(poorDonorResult.status === 'ESTABLISHED', 'Status is ESTABLISHED');
  assert(poorDonorResult.score < 50, `Poor donor score is < 50 (got ${poorDonorResult.score})`);
  assert(poorDonorResult.breakdown.noShowRate === 100, `No-show rate calculated as 100% (got ${poorDonorResult.breakdown.noShowRate}%)`);
  assert(poorDonorResult.breakdown.cancellationRate === 50, `Cancellation rate calculated as 50% (got ${poorDonorResult.breakdown.cancellationRate}%)`);

  // --------------------------------------------------------
  // Test Group 4: Score Bounds Enforcement (0 - 100)
  // --------------------------------------------------------
  console.log('\nTest Group 4: Score Bounds Enforcement (0 to 100)');

  const extremeLowResult = engine.evaluateReliability({
    id: 'rel-donor-extreme-low',
    total_requests_received: 100,
    total_requests_accepted: 100,
    total_completed_donations: 0,
    total_no_shows: 100,
    total_cancellations: 100,
  });

  assert(extremeLowResult.score >= 0, `Score bounded at minimum >= 0 (got ${extremeLowResult.score})`);

  const extremeHighResult = engine.evaluateReliability({
    id: 'rel-donor-extreme-high',
    total_requests_received: 50,
    total_requests_accepted: 50,
    total_completed_donations: 50,
    total_no_shows: 0,
    total_cancellations: 0,
    last_donation_date: new Date(),
  });

  assert(extremeHighResult.score <= 100, `Score bounded at maximum <= 100 (got ${extremeHighResult.score})`);

  // --------------------------------------------------------
  // Test Group 5: Custom Weights Model
  // --------------------------------------------------------
  console.log('\nTest Group 5: Custom Scoring Weights');

  const customEngine = new DonorReliabilityEngine({
    noShowInverseWeight: 0.50, // 50% penalty weight on no-shows
    successfulDonationWeight: 0.50,
    responseRateWeight: 0,
    acceptanceRateWeight: 0,
    cancellationInverseWeight: 0,
    recentActivityWeight: 0,
  });

  const customResult = customEngine.evaluateReliability({
    id: 'rel-donor-custom',
    total_requests_received: 10,
    total_requests_accepted: 10,
    total_completed_donations: 5,
    total_no_shows: 5,
  });

  // 50% successful (50 * 0.5 = 25) + 50% no-show (50 * 0.5 = 25) = 50
  assert(customResult.score === 50, `Custom weighted score evaluated correctly (expected 50, got ${customResult.score})`);

  // --------------------------------------------------------
  // Test Group 6: Database Persistence & Recalculation
  // --------------------------------------------------------
  console.log('\nTest Group 6: Database Persistence & Recalculation');

  const dbDonor = await prisma.user.create({
    data: {
      id: `rel-db-donor-${Date.now()}`,
      name: 'Persisted Donor',
      email: `persisted.${Date.now()}@test.com`,
      password_hash: 'hash',
      role: 'DONOR',
      total_requests_received: 5,
      total_requests_accepted: 5,
      total_completed_donations: 5,
      total_no_shows: 0,
      total_cancellations: 0,
    },
  });

  const evaluated = engine.evaluateReliability({
    id: dbDonor.id,
    name: dbDonor.name,
    total_requests_received: dbDonor.total_requests_received,
    total_requests_accepted: dbDonor.total_requests_accepted,
    total_completed_donations: dbDonor.total_completed_donations,
    total_no_shows: dbDonor.total_no_shows,
    total_cancellations: dbDonor.total_cancellations,
  });

  const updatedUser = await prisma.user.update({
    where: { id: dbDonor.id },
    data: {
      reliability_score: evaluated.score,
      reliability_last_updated: new Date(),
    },
  });

  assert(updatedUser.reliability_score === evaluated.score, `Reliability score persisted in database (${updatedUser.reliability_score})`);
  assert(updatedUser.reliability_last_updated !== null, 'Reliability timestamp updated');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
