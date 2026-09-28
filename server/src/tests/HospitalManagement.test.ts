import prisma from '../config/db.js';

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

async function runTests() {
  console.log('\n==================================================');
  console.log('  RUNNING HOSPITAL MANAGEMENT TEST SUITE');
  console.log('==================================================\n');

  // --------------------------------------------------------
  // Test 1: Retrieve Initial Pre-Populated Indian Partner Hospitals
  // --------------------------------------------------------
  console.log('Test Group 1: Pre-Populated Partner Hospitals');
  const hospitals = await prisma.hospital.findMany();
  assert(hospitals.length >= 4, `Initial hospitals list contains ${hospitals.length} partner hospitals (>=4)`);

  const aiims = hospitals.find((h: any) => h.name.includes('AIIMS'));
  assert(aiims !== undefined, 'AIIMS New Delhi trauma hospital found in initial database');
  assert(aiims?.latitude === 28.5672 && aiims?.longitude === 77.21, 'AIIMS coordinates verified');

  // --------------------------------------------------------
  // Test 2: Create a New Hospital
  // --------------------------------------------------------
  console.log('\nTest Group 2: Create a New Hospital');
  const newHospital = await prisma.hospital.create({
    data: {
      name: 'Manipal Hospital Bengaluru',
      address: '98 HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017',
      latitude: 12.9585,
      longitude: 77.6486,
      contact_number: '+91-80-25024444',
      emergency_contact: '+91-80-25023333',
      is_verified: true,
      is_active: true,
    },
  });

  assert(newHospital.id !== undefined, 'Hospital created with unique ID');
  assert(newHospital.name === 'Manipal Hospital Bengaluru', 'Hospital name created correctly');

  // --------------------------------------------------------
  // Test 3: Update Hospital Profile
  // --------------------------------------------------------
  console.log('\nTest Group 3: Update Hospital Profile');
  const updated = await prisma.hospital.update({
    where: { id: newHospital.id },
    data: {
      contact_number: '+91-80-99990000',
      address: 'Updated HAL Airport Rd Campus, Bengaluru',
    },
  });

  assert(updated.contact_number === '+91-80-99990000', 'Hospital contact number updated');
  assert(updated.address.includes('Updated'), 'Hospital address updated');

  // --------------------------------------------------------
  // Test 4: Verify & Deactivate Hospital Status
  // --------------------------------------------------------
  console.log('\nTest Group 4: Verify & Deactivate Hospital Status');
  const deactivated = await prisma.hospital.update({
    where: { id: newHospital.id },
    data: { is_active: false },
  });

  assert(deactivated.is_active === false, 'Hospital deactivated successfully');

  const reVerified = await prisma.hospital.update({
    where: { id: newHospital.id },
    data: { is_active: true, is_verified: true },
  });
  assert(reVerified.is_active === true && reVerified.is_verified === true, 'Hospital re-verified and activated');

  // --------------------------------------------------------
  // Test 5: Legacy Compatibility with Blood Request hospital_name
  // --------------------------------------------------------
  console.log('\nTest Group 5: Legacy Compatibility with Blood Request hospital_name');

  const legacyRequest = {
    id: 'req-legacy-01',
    requester_id: 'user-patient-01',
    blood_group: 'O_NEG',
    units_requested: 2,
    hospital_name: 'AIIMS New Delhi - Emergency Trauma Bay',
    hospital_id: 'hosp-aiims',
    urgency: 'STAT_CRITICAL',
    status: 'PENDING',
  };

  const createdReq = await prisma.bloodRequest.create({ data: legacyRequest });
  assert(createdReq.hospital_name === 'AIIMS New Delhi - Emergency Trauma Bay', 'Blood request created with hospital_name');
  assert(createdReq.hospital_id === 'hosp-aiims', 'Blood request linked to hospital_id');

  // Query requests filtered by hospital name
  const allReqs = await prisma.bloodRequest.findMany();
  const matched = allReqs.filter(
    (r: any) => r.hospital_id === 'hosp-aiims' || r.hospital_name.includes('AIIMS')
  );
  assert(matched.length > 0, 'Hospital request query successfully retrieves matching legacy request');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
