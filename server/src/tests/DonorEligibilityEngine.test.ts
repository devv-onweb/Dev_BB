import {
  DonorEligibilityEngine,
  DonorEligibilityStatus,
} from '../services/donor/DonorEligibilityEngine.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function runTests() {
  console.log('\n==================================================');
  console.log('  RUNNING DONOR ELIGIBILITY ENGINE TEST SUITE');
  console.log('==================================================\n');

  const engine = new DonorEligibilityEngine();
  const baseDate = new Date('2026-09-28T00:00:00.000Z');

  // --------------------------------------------------------
  // Test Case 1: New donor with no previous donation
  // --------------------------------------------------------
  console.log('Test Case 1: New donor with no previous donation');
  const newDonor = { id: 'd-1', name: 'New Donor' };
  const res1 = engine.evaluate(newDonor, baseDate);
  assert(res1.status === DonorEligibilityStatus.ELIGIBLE, 'Status is ELIGIBLE');
  assert(res1.eligible === true, 'eligible flag is true');
  assert(res1.reasons.length === 0, 'No ineligibility reasons');

  // --------------------------------------------------------
  // Test Case 2: Donor who donated exactly 56 days ago
  // --------------------------------------------------------
  console.log('\nTest Case 2: Donor who completed the 56-day interval');
  const date56DaysAgo = new Date(baseDate);
  date56DaysAgo.setDate(date56DaysAgo.getDate() - 56);

  const donor56Days = {
    id: 'd-2',
    name: 'Completed Interval Donor',
    donations: [
      { id: 'don-1', donation_date: date56DaysAgo.toISOString(), status: 'APPROVED' },
    ],
  };
  const res2 = engine.evaluate(donor56Days, baseDate);
  assert(res2.status === DonorEligibilityStatus.ELIGIBLE, 'Status is ELIGIBLE');
  assert(res2.eligible === true, 'eligible flag is true');

  // --------------------------------------------------------
  // Test Case 3: Donor who donated too recently (20 days ago)
  // --------------------------------------------------------
  console.log('\nTest Case 3: Donor who donated too recently (<56 days)');
  const date20DaysAgo = new Date(baseDate);
  date20DaysAgo.setDate(date20DaysAgo.getDate() - 20);

  const donor20Days = {
    id: 'd-3',
    name: 'Recent Donor',
    donations: [
      { id: 'don-2', donation_date: date20DaysAgo.toISOString(), status: 'APPROVED' },
    ],
  };
  const res3 = engine.evaluate(donor20Days, baseDate);
  assert(res3.status === DonorEligibilityStatus.TEMPORARILY_INELIGIBLE, 'Status is TEMPORARILY_INELIGIBLE');
  assert(res3.eligible === false, 'eligible flag is false');
  assert(res3.daysRemaining === 36, 'Calculated 36 days remaining (56 - 20)');

  // --------------------------------------------------------
  // Test Case 4: Donor with active temporary deferral
  // --------------------------------------------------------
  console.log('\nTest Case 4: Donor with active temporary deferral date');
  const tempDeferralUntil = new Date(baseDate);
  tempDeferralUntil.setDate(tempDeferralUntil.getDate() + 14); // 14 days in future

  const donorTempDeferral = {
    id: 'd-4',
    name: 'Temporarily Deferred Donor',
    deferral_status: DonorEligibilityStatus.TEMPORARILY_INELIGIBLE,
    deferral_reason: 'Low hemoglobin screening on site.',
    deferral_until: tempDeferralUntil.toISOString(),
  };
  const res4 = engine.evaluate(donorTempDeferral, baseDate);
  assert(res4.status === DonorEligibilityStatus.TEMPORARILY_INELIGIBLE, 'Status is TEMPORARILY_INELIGIBLE');
  assert(res4.eligible === false, 'eligible flag is false');
  assert(res4.reasons[0].includes('Low hemoglobin'), 'Reason contains deferral reason');

  // --------------------------------------------------------
  // Test Case 5: Donor with permanent deferral
  // --------------------------------------------------------
  console.log('\nTest Case 5: Donor with permanent deferral');
  const donorPermDeferral = {
    id: 'd-5',
    name: 'Permanently Deferred Donor',
    deferral_status: DonorEligibilityStatus.PERMANENTLY_DEFERRED,
    deferral_reason: 'Medical history contraindication.',
  };
  const res5 = engine.evaluate(donorPermDeferral, baseDate);
  assert(res5.status === DonorEligibilityStatus.PERMANENTLY_DEFERRED, 'Status is PERMANENTLY_DEFERRED');
  assert(res5.eligible === false, 'eligible flag is false');
  assert(res5.reasons[0].includes('contraindication'), 'Reason contains permanent deferral details');

  // --------------------------------------------------------
  // Test Case 6: Donor requiring medical review
  // --------------------------------------------------------
  console.log('\nTest Case 6: Donor requiring medical review');
  const donorReview = {
    id: 'd-6',
    name: 'Medical Review Donor',
    deferral_status: DonorEligibilityStatus.REQUIRES_MEDICAL_REVIEW,
    medical_review_notes: 'Travel history to endemic zone needs physician review.',
  };
  const res6 = engine.evaluate(donorReview, baseDate);
  assert(res6.status === DonorEligibilityStatus.REQUIRES_MEDICAL_REVIEW, 'Status is REQUIRES_MEDICAL_REVIEW');
  assert(res6.eligible === false, 'eligible flag is false');
  assert(res6.medicalReviewNotes?.includes('endemic zone') === true, 'Medical review notes returned');

  // --------------------------------------------------------
  // Test Case 7: Invalid/missing donor data
  // --------------------------------------------------------
  console.log('\nTest Case 7: Invalid or null donor data');
  const res7 = engine.evaluate(null as any, baseDate);
  assert(res7.status === DonorEligibilityStatus.REQUIRES_MEDICAL_REVIEW, 'Null donor safely handled');
  assert(res7.eligible === false, 'eligible flag is false');

  // --------------------------------------------------------
  // Test Case 8: Next eligible date calculation accuracy
  // --------------------------------------------------------
  console.log('\nTest Case 8: Next eligible date calculation');
  const lastDate = new Date('2026-09-01T00:00:00.000Z');
  const donorCalc = {
    id: 'd-8',
    donations: [{ id: 'don-8', donation_date: lastDate.toISOString(), status: 'APPROVED' }],
  };
  const res8 = engine.evaluate(donorCalc, baseDate);
  // Sept 1 + 56 days = Oct 27
  assert(res8.nextEligibleDate === '2026-10-27', `Next eligible date is 2026-10-27 (got ${res8.nextEligibleDate})`);

  // --------------------------------------------------------
  // Test Case 9: Multiple historical donations uses latest approved
  // --------------------------------------------------------
  console.log('\nTest Case 9: Multiple donations uses latest approved');
  const donorMulti = {
    id: 'd-9',
    donations: [
      { id: 'don-old', donation_date: '2025-01-01T00:00:00.000Z', status: 'APPROVED' },
      { id: 'don-recent', donation_date: date20DaysAgo.toISOString(), status: 'APPROVED' },
      { id: 'don-rejected', donation_date: baseDate.toISOString(), status: 'REJECTED' },
    ],
  };
  const res9 = engine.evaluate(donorMulti, baseDate);
  assert(res9.status === DonorEligibilityStatus.TEMPORARILY_INELIGIBLE, 'Status evaluated using latest APPROVED donation');

  // --------------------------------------------------------
  // Test Case 10: Custom rules configuration (e.g. 90-day interval rule)
  // --------------------------------------------------------
  console.log('\nTest Case 10: Custom rules configuration (90-day interval)');
  const customEngine = new DonorEligibilityEngine({ minDaysBetweenDonations: 90 });
  const date60DaysAgo = new Date(baseDate);
  date60DaysAgo.setDate(date60DaysAgo.getDate() - 60);

  const donor60 = {
    id: 'd-10',
    donations: [{ id: 'don-10', donation_date: date60DaysAgo.toISOString(), status: 'APPROVED' }],
  };
  const res10 = customEngine.evaluate(donor60, baseDate);
  assert(res10.status === DonorEligibilityStatus.TEMPORARILY_INELIGIBLE, '60 days ago is ineligible under 90-day rule');
  assert(res10.daysRemaining === 30, 'Calculated 30 days remaining for 90-day rule');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
