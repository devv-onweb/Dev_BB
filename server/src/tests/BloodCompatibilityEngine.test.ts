import { BloodCompatibilityEngine, ALL_CANONICAL_BLOOD_GROUPS } from '../services/BloodCompatibilityEngine.js';

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
  console.log('  RUNNING BLOOD COMPATIBILITY ENGINE TEST SUITE');
  console.log('==================================================\n');

  // --------------------------------------------------------
  // 1. ALL 64 DONOR x RECIPIENT RBC COMBINATIONS TEST
  // --------------------------------------------------------
  console.log('Test Group 1: Complete 8x8 (64 pairs) Compatibility Matrix Verification');

  const EXPECTED_MATRIX: Record<string, string[]> = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  };

  let totalPairCount = 0;
  for (const donor of ALL_CANONICAL_BLOOD_GROUPS) {
    for (const recipient of ALL_CANONICAL_BLOOD_GROUPS) {
      totalPairCount++;
      const result = BloodCompatibilityEngine.isCompatible(donor, recipient, 'RBC');
      const expectedCompatible = EXPECTED_MATRIX[recipient].includes(donor);

      assert(
        result.compatible === expectedCompatible,
        `Pair ${donor} -> ${recipient}: expected compatible=${expectedCompatible}, got=${result.compatible}`
      );
    }
  }
  assert(totalPairCount === 64, `Verified total 64 pairs evaluated (got ${totalPairCount})`);

  // --------------------------------------------------------
  // 2. EXPLICIT REQUIRED PASSING COMBINATIONS
  // --------------------------------------------------------
  console.log('\nTest Group 2: Explicit Required Passing Combinations (Direction: Donor -> Recipient)');

  const REQUIRED_PASSES = [
    // O- universal donor
    ['O-', 'O-'], ['O-', 'O+'], ['O-', 'A-'], ['O-', 'A+'],
    ['O-', 'B-'], ['O-', 'B+'], ['O-', 'AB-'], ['O-', 'AB+'],
    // A-
    ['A-', 'A-'], ['A-', 'A+'], ['A-', 'AB-'], ['A-', 'AB+'],
    // B-
    ['B-', 'B-'], ['B-', 'B+'], ['B-', 'AB-'], ['B-', 'AB+'],
    // AB-
    ['AB-', 'AB-'], ['AB-', 'AB+'],
  ];

  for (const [donor, recipient] of REQUIRED_PASSES) {
    const res = BloodCompatibilityEngine.isCompatible(donor, recipient);
    assert(res.compatible === true, `MUST PASS: Donor ${donor} -> Recipient ${recipient}`);
  }

  // --------------------------------------------------------
  // 3. EXPLICIT REQUIRED FAILING COMBINATIONS
  // --------------------------------------------------------
  console.log('\nTest Group 3: Explicit Required Failing Combinations');

  const REQUIRED_FAILS = [
    ['A+', 'O+'],
    ['B+', 'A+'],
    ['AB+', 'A+'],
    ['A-', 'B-'],
    ['B-', 'A-'],
    ['AB+', 'O-'],
  ];

  for (const [donor, recipient] of REQUIRED_FAILS) {
    const res = BloodCompatibilityEngine.isCompatible(donor, recipient);
    assert(res.compatible === false, `MUST FAIL: Donor ${donor} -> Recipient ${recipient}`);
  }

  // --------------------------------------------------------
  // 4. FORMAT FLEXIBILITY & ENUM COMPATIBILITY
  // --------------------------------------------------------
  console.log('\nTest Group 4: Format Flexibility & Enum Inputs');

  const enumTest1 = BloodCompatibilityEngine.isCompatible('O_NEG', 'A_POS');
  assert(enumTest1.compatible === true, 'Enum format O_NEG -> A_POS works correctly');

  const lowerCaseTest = BloodCompatibilityEngine.isCompatible(' o- ', ' a- ');
  assert(lowerCaseTest.compatible === true, 'Trimmed lowercase " o- " -> " a- " works correctly');

  const enumTest2 = BloodCompatibilityEngine.isCompatible('A_POS', 'O_POS');
  assert(enumTest2.compatible === false, 'Enum format A_POS -> O_POS correctly returns false');

  // --------------------------------------------------------
  // 5. INVALID INPUT & EDGE CASES
  // --------------------------------------------------------
  console.log('\nTest Group 5: Invalid Input & Error Handling');

  const invalid1 = BloodCompatibilityEngine.isCompatible('', 'A+');
  assert(invalid1.compatible === false && invalid1.error === 'INVALID_BLOOD_GROUP', 'Empty donor string handled');

  const invalid2 = BloodCompatibilityEngine.isCompatible(null, 'A+');
  assert(invalid2.compatible === false && invalid2.error === 'INVALID_BLOOD_GROUP', 'Null donor handled');

  const invalid3 = BloodCompatibilityEngine.isCompatible(undefined, 'A+');
  assert(invalid3.compatible === false && invalid3.error === 'INVALID_BLOOD_GROUP', 'Undefined donor handled');

  const invalid4 = BloodCompatibilityEngine.isCompatible('X_INVALID', 'A+');
  assert(invalid4.compatible === false && invalid4.error === 'INVALID_BLOOD_GROUP', 'Malformed donor handled');

  const invalid5 = BloodCompatibilityEngine.isCompatible('O-', 'INVALID_RECIP');
  assert(invalid5.compatible === false && invalid5.error === 'INVALID_BLOOD_GROUP', 'Malformed recipient handled');

  // --------------------------------------------------------
  // 6. COMPONENT TYPE VALIDATION
  // --------------------------------------------------------
  console.log('\nTest Group 6: Component Type Validation');

  const plasmaTest = BloodCompatibilityEngine.isCompatible('O-', 'A+', 'PLASMA');
  assert(
    plasmaTest.compatible === false && plasmaTest.error === 'UNSUPPORTED_COMPONENT_TYPE',
    'Unsupported component type PLASMA handled with UNSUPPORTED_COMPONENT_TYPE'
  );

  // --------------------------------------------------------
  // 7. COMPATIBLE DONOR / RECIPIENT QUERY METHODS
  // --------------------------------------------------------
  console.log('\nTest Group 7: Helper Query Methods (getCompatibleDonorGroups & getCompatibleRecipientGroups)');

  const donorsForAPos = BloodCompatibilityEngine.getCompatibleDonorGroups('A+');
  assert(
    donorsForAPos.success && donorsForAPos.compatibleGroups.join(',') === 'O-,O+,A-,A+',
    `getCompatibleDonorGroups("A+") returned: ${donorsForAPos.compatibleGroups.join(',')}`
  );

  const recipientsForONeg = BloodCompatibilityEngine.getCompatibleRecipientGroups('O-');
  assert(
    recipientsForONeg.success && recipientsForONeg.compatibleGroups.length === 8,
    `getCompatibleRecipientGroups("O-") returned all 8 recipients`
  );

  const recipientsForABPos = BloodCompatibilityEngine.getCompatibleRecipientGroups('AB+');
  assert(
    recipientsForABPos.success && recipientsForABPos.compatibleGroups.join(',') === 'AB+',
    `getCompatibleRecipientGroups("AB+") returned only AB+`
  );

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
