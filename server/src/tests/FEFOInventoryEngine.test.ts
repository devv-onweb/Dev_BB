import { FEFOInventoryEngine } from '../services/inventory/FEFOInventoryEngine.js';
import { ExpiryManagementService, BloodUnitStatus } from '../services/inventory/ExpiryManagementService.js';

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
  console.log('  RUNNING FEFO INVENTORY & EXPIRY ENGINE TEST SUITE');
  console.log('==================================================\n');

  const expiryService = new ExpiryManagementService();
  const fefoEngine = new FEFOInventoryEngine();
  const currentDate = new Date('2026-09-28T00:00:00.000Z');

  // --------------------------------------------------------
  // Test 1: Expiry Threshold Detection
  // --------------------------------------------------------
  console.log('Test Group 1: Expiry Threshold Detection');

  // Normal: Expiry in 30 days
  const expNormal = new Date(currentDate);
  expNormal.setDate(expNormal.getDate() + 30);
  const evalNormal = expiryService.evaluate(expNormal, currentDate);
  assert(evalNormal.category === 'NORMAL', '30 days remaining categorized as NORMAL');
  assert(evalNormal.isExpired === false, 'isExpired is false');

  // Expiring Soon: Expiry in 8 days
  const expSoon = new Date(currentDate);
  expSoon.setDate(expSoon.getDate() + 8);
  const evalSoon = expiryService.evaluate(expSoon, currentDate);
  assert(evalSoon.category === 'EXPIRING_SOON', '8 days remaining categorized as EXPIRING_SOON');
  assert(evalSoon.isExpiringSoon === true, 'isExpiringSoon is true');

  // High Priority: Expiry in 2 days
  const expHigh = new Date(currentDate);
  expHigh.setDate(expHigh.getDate() + 2);
  const evalHigh = expiryService.evaluate(expHigh, currentDate);
  assert(evalHigh.category === 'HIGH_PRIORITY', '2 days remaining categorized as HIGH_PRIORITY');
  assert(evalHigh.isHighPriority === true, 'isHighPriority is true');

  // Expired: Expiry 1 day in past
  const expPast = new Date(currentDate);
  expPast.setDate(expPast.getDate() - 1);
  const evalPast = expiryService.evaluate(expPast, currentDate);
  assert(evalPast.category === 'EXPIRED', 'Past date categorized as EXPIRED');
  assert(evalPast.isExpired === true, 'isExpired is true');

  // --------------------------------------------------------
  // Test 2: FEFO Order Allocation (Earliest Expiring First)
  // --------------------------------------------------------
  console.log('\nTest Group 2: FEFO Allocation Order');

  const unitLate = {
    id: 'u-late',
    unit_number: 'UNIT-LATE',
    blood_group: 'A_POS',
    component_type: 'RBC',
    expiry_date: new Date('2026-11-15T00:00:00.000Z'),
    status: BloodUnitStatus.AVAILABLE,
  };

  const unitEarly = {
    id: 'u-early',
    unit_number: 'UNIT-EARLY',
    blood_group: 'A_POS',
    component_type: 'RBC',
    expiry_date: new Date('2026-10-05T00:00:00.000Z'), // Expires sooner
    status: BloodUnitStatus.AVAILABLE,
  };

  const pool = [unitLate, unitEarly];
  const allocRes = fefoEngine.allocateFromPool(
    { recipientBloodGroup: 'A+', unitsRequested: 1, componentType: 'RBC' },
    pool,
    currentDate
  );

  assert(allocRes.success === true, 'Allocation successful');
  assert(allocRes.allocatedUnits.length === 1, 'Allocated 1 unit');
  assert(allocRes.allocatedUnits[0].id === 'u-early', 'Earliest expiring unit (UNIT-EARLY) allocated first');

  // --------------------------------------------------------
  // Test 3: Exclude Expired Units from Allocation
  // --------------------------------------------------------
  console.log('\nTest Group 3: Exclude Expired Units from Allocation');

  const unitExpired = {
    id: 'u-expired',
    unit_number: 'UNIT-EXPIRED',
    blood_group: 'O_NEG',
    component_type: 'RBC',
    expiry_date: new Date('2026-09-20T00:00:00.000Z'), // Past expiry!
    status: BloodUnitStatus.AVAILABLE,
  };

  const poolWithExpired = [unitExpired];
  const allocExpRes = fefoEngine.allocateFromPool(
    { recipientBloodGroup: 'O-', unitsRequested: 1, componentType: 'RBC' },
    poolWithExpired,
    currentDate
  );

  assert(allocExpRes.success === false, 'Allocation fails when only expired units exist');
  assert(allocExpRes.allocatedUnits.length === 0, 'No expired units allocated');

  // --------------------------------------------------------
  // Test 4: Blood Compatibility Filter during Allocation
  // --------------------------------------------------------
  console.log('\nTest Group 4: Compatibility Filter during Allocation');

  const unitBPos = {
    id: 'u-bpos',
    unit_number: 'UNIT-BPOS',
    blood_group: 'B_POS',
    component_type: 'RBC',
    expiry_date: new Date('2026-10-20T00:00:00.000Z'),
    status: BloodUnitStatus.AVAILABLE,
  };

  const unitONeg = {
    id: 'u-oneg',
    unit_number: 'UNIT-ONEG',
    blood_group: 'O_NEG',
    component_type: 'RBC',
    expiry_date: new Date('2026-10-25T00:00:00.000Z'),
    status: BloodUnitStatus.AVAILABLE,
  };

  // Recipient A- can receive O- or A-, but NOT B+
  const poolIncompat = [unitBPos, unitONeg];
  const allocCompatRes = fefoEngine.allocateFromPool(
    { recipientBloodGroup: 'A-', unitsRequested: 1, componentType: 'RBC' },
    poolIncompat,
    currentDate
  );

  assert(allocCompatRes.success === true, 'Allocation succeeds using compatible O- unit');
  assert(allocCompatRes.allocatedUnits[0].id === 'u-oneg', 'Incompatible B+ unit skipped; compatible O- unit selected');

  // --------------------------------------------------------
  // Test 5: Partial Allocation & Shortage Handling
  // --------------------------------------------------------
  console.log('\nTest Group 5: Partial Allocation & Shortage Handling');

  const allocShortageRes = fefoEngine.allocateFromPool(
    { recipientBloodGroup: 'A-', unitsRequested: 3, componentType: 'RBC' },
    poolIncompat, // Only 1 compatible unit available
    currentDate
  );

  assert(allocShortageRes.success === false, 'Success is false on partial shortage');
  assert(allocShortageRes.unitsAllocatedCount === 1, '1 unit allocated');
  assert(allocShortageRes.shortageCount === 2, '2 units shortage reported');

  // --------------------------------------------------------
  // Test 6: Wastage Analytics Calculation
  // --------------------------------------------------------
  console.log('\nTest Group 6: Wastage Analytics Calculation');

  const analyticsPool = [
    { blood_group: 'O_POS', expiry_date: new Date('2026-10-30'), status: BloodUnitStatus.AVAILABLE },
    { blood_group: 'O_POS', expiry_date: new Date('2026-09-01'), status: BloodUnitStatus.EXPIRED },
    { blood_group: 'A_POS', expiry_date: new Date('2026-10-30'), status: BloodUnitStatus.USED },
    { blood_group: 'A_POS', expiry_date: new Date('2026-09-01'), status: BloodUnitStatus.DISCARDED },
  ];

  const analytics = expiryService.calculateWastageAnalytics(analyticsPool, currentDate);
  assert(analytics.totalUnits === 4, 'Total units is 4');
  assert(analytics.totalWastedUnits === 2, 'Total wasted units (1 expired + 1 discarded) is 2');
  assert(analytics.wastageRatePercent === 50, 'Wastage rate is 50%');
  assert(analytics.utilizationRatePercent === 25, 'Utilization rate is 25%');

  // --------------------------------------------------------
  // Test 7: Invalid Inputs Handling
  // --------------------------------------------------------
  console.log('\nTest Group 7: Invalid Inputs Handling');

  const invalidGroupRes = fefoEngine.allocateFromPool(
    { recipientBloodGroup: 'INVALID', unitsRequested: 1 },
    pool,
    currentDate
  );
  assert(invalidGroupRes.success === false, 'Invalid blood group rejected');

  const invalidUnitsRes = fefoEngine.allocateFromPool(
    { recipientBloodGroup: 'A+', unitsRequested: -5 },
    pool,
    currentDate
  );
  assert(invalidUnitsRes.success === false, 'Negative units requested rejected');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
