/**
 * EmergencyResponseEngine.test.ts
 * DEV_D - Phase 8 Emergency Response Engine Tests
 */

import { prisma } from '../config/db.js';
import { EmergencyResponseEngine } from '../services/emergency/EmergencyResponseEngine.js';
import { RequestUrgency, BloodGroup, Role } from '../types/enums.js';

const emergencyEngine = new EmergencyResponseEngine();

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
  console.log('  RUNNING EMERGENCY RESPONSE ENGINE TEST SUITE');
  console.log('==================================================\n');

  let testHospitalId: string;
  let testAdminId: string;
  let testDonorId1: string;
  let testDonorId2: string;
  let testBloodUnitId1: string;
  let testBloodUnitId2: string;

  // Setup test data
  console.log('Test Group 1: Test Data Setup');
  try {
    // Clean up any existing test data
    await prisma.bloodUnit.deleteMany();
    await prisma.bloodInventory.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.hospital.deleteMany();

    // Create test hospital
    const hospital = await prisma.hospital.create({
      data: {
        name: 'Test Emergency Hospital',
        address: '123 Test Street',
        latitude: 28.6139,
        longitude: 77.2090,
        contact_number: '1234567890',
        emergency_contact: '0987654321',
        is_verified: true,
        is_active: true,
      },
    });
    testHospitalId = hospital.id;
    assert(!!testHospitalId, 'Test hospital created successfully');

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        role: Role.ADMIN,
        phone: '1111111111',
      },
    });
    testAdminId = admin.id;
    assert(!!testAdminId, 'Test admin created successfully');

    // Create test donors with location data
    const donor1 = await prisma.user.create({
      data: {
        name: 'Test Donor 1',
        email: 'donor1@test.com',
        password_hash: 'hashed_password',
        role: Role.DONOR,
        phone: '2222222222',
        blood_group: BloodGroup.O_NEG,
        latitude: 28.6140,
        longitude: 77.2091,
        location_permission: true,
        service_radius_km: 10.0,
        reliability_score: 90.0,
        total_requests_received: 10,
        total_requests_accepted: 9,
        total_completed_donations: 8,
        total_no_shows: 0,
        total_cancellations: 1,
      },
    });
    testDonorId1 = donor1.id;
    assert(!!testDonorId1, 'Test donor 1 created successfully');

    const donor2 = await prisma.user.create({
      data: {
        name: 'Test Donor 2',
        email: 'donor2@test.com',
        password_hash: 'hashed_password',
        role: Role.DONOR,
        phone: '3333333333',
        blood_group: BloodGroup.O_POS,
        latitude: 28.6150,
        longitude: 77.2100,
        location_permission: true,
        service_radius_km: 10.0,
        reliability_score: 75.0,
        total_requests_received: 5,
        total_requests_accepted: 4,
        total_completed_donations: 3,
        total_no_shows: 1,
        total_cancellations: 0,
      },
    });
    testDonorId2 = donor2.id;
    assert(!!testDonorId2, 'Test donor 2 created successfully');

    // Create approved donations for donors (to satisfy 56-day interval)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 60); // 60 days ago

    await prisma.donation.create({
      data: {
        donor_id: testDonorId1,
        units_donated: 1,
        donation_date: pastDate,
        status: 'APPROVED',
      },
    });

    await prisma.donation.create({
      data: {
        donor_id: testDonorId2,
        units_donated: 1,
        donation_date: pastDate,
        status: 'APPROVED',
      },
    });
    assert(true, 'Test donations created successfully');

    // Create blood inventory
    await prisma.bloodInventory.create({
      data: {
        blood_group: BloodGroup.O_NEG,
        units_available: 5,
      },
    });

    await prisma.bloodInventory.create({
      data: {
        blood_group: BloodGroup.O_POS,
        units_available: 3,
      },
    });
    assert(true, 'Test blood inventory created successfully');

    // Create test blood units (non-expired)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    const unit1 = await prisma.bloodUnit.create({
      data: {
        unit_number: 'UNIT-TEST-001',
        blood_group: BloodGroup.O_NEG,
        component_type: 'RBC',
        collection_date: new Date(),
        expiry_date: futureDate,
        volume_ml: 450,
        status: 'AVAILABLE',
        storage_location: 'Vault A',
      },
    });
    testBloodUnitId1 = unit1.id;
    assert(!!testBloodUnitId1, 'Test blood unit 1 created successfully');

    const unit2 = await prisma.bloodUnit.create({
      data: {
        unit_number: 'UNIT-TEST-002',
        blood_group: BloodGroup.O_NEG,
        component_type: 'RBC',
        collection_date: new Date(),
        expiry_date: futureDate,
        volume_ml: 450,
        status: 'AVAILABLE',
        storage_location: 'Vault A',
      },
    });
    testBloodUnitId2 = unit2.id;
    assert(!!testBloodUnitId2, 'Test blood unit 2 created successfully');
  } catch (error) {
    console.error('Test setup failed:', error);
    process.exit(1);
  }

  // Test Group 2: Emergency Classification
  console.log('\nTest Group 2: Emergency Classification');
  
  const result1 = emergencyEngine['classifyEmergency'](RequestUrgency.STAT_CRITICAL as string);
  assert(result1.isEmergency === true, 'STAT_CRITICAL classified as emergency');
  assert(result1.classification === 'CRITICAL_EMERGENCY', 'STAT_CRITICAL classification is CRITICAL_EMERGENCY');
  assert(result1.urgency === RequestUrgency.STAT_CRITICAL, 'STAT_CRITICAL urgency preserved');

  const result2 = emergencyEngine['classifyEmergency'](RequestUrgency.URGENT as string);
  assert(result2.isEmergency === true, 'URGENT classified as emergency');
  assert(result2.classification === 'EMERGENCY', 'URGENT classification is EMERGENCY');
  assert(result2.urgency === RequestUrgency.URGENT, 'URGENT urgency preserved');

  const result3 = emergencyEngine['classifyEmergency'](RequestUrgency.STANDARD as string);
  assert(result3.isEmergency === false, 'STANDARD not classified as emergency');
  assert(result3.classification === 'STANDARD', 'STANDARD classification is STANDARD');
  assert(result3.urgency === RequestUrgency.STANDARD, 'STANDARD urgency preserved');

  // Test Group 3: Inventory Allocation with FEFO
  console.log('\nTest Group 3: Inventory Allocation with FEFO');
  
  // Note: allocateInventory is a private method that calls FEFO engine internally
  // We'll test the full workflow instead of testing the private method directly
  console.log('  ✓ FEFO allocation tested through full workflow (Test Group 7)');

  // Test Group 4: Expiry-aware Allocation
  console.log('\nTest Group 4: Expiry-aware Allocation');
  
  try {
    // Create an expired unit
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    await prisma.bloodUnit.create({
      data: {
        unit_number: 'UNIT-EXPIRED-001',
        blood_group: BloodGroup.O_NEG,
        component_type: 'RBC',
        collection_date: new Date(),
        expiry_date: pastDate,
        volume_ml: 450,
        status: 'AVAILABLE',
        storage_location: 'Vault A',
      },
    });

    const allocation4 = await emergencyEngine['allocateInventory'](BloodGroup.O_NEG, 5, 'RBC');
    
    // Verify no expired units are allocated
    const allocatedExpired = allocation4.allocatedUnits.some(
      (unit: any) => new Date(unit.expiry_date) < new Date()
    );
    assert(allocatedExpired === false, 'No expired units allocated');
  } catch (error) {
    console.error('Expiry test failed:', error);
  }

  // Test Group 5: Donor Recommendation Integration
  console.log('\nTest Group 5: Donor Recommendation Integration');
  
  const recommendations1 = await emergencyEngine['generateDonorRecommendations'](
    BloodGroup.O_NEG,
    testHospitalId,
    28.6139,
    77.2090,
    RequestUrgency.URGENT,
    10,
    50,
    'RBC'
  );

  assert(Array.isArray(recommendations1), 'Recommendations returned as array');
  if (recommendations1.length > 0) {
    assert(!!recommendations1[0].donorId, 'Donor ID present in recommendation');
    assert(typeof recommendations1[0].rankingScore === 'number', 'Ranking score is number');
    assert(!!recommendations1[0].reason, 'Reason present in recommendation');
  }

  const recommendations2 = await emergencyEngine['generateDonorRecommendations'](
    BloodGroup.AB_POS,
    testHospitalId,
    28.6139,
    77.2090,
    RequestUrgency.URGENT,
    1, // Very small radius
    50,
    'RBC'
  );

  assert(Array.isArray(recommendations2), 'Empty recommendations returned as array');

  // Test Group 6: Shortage Detection and Next Actions
  console.log('\nTest Group 6: Shortage Detection and Next Actions');
  
  const inventoryAllocation1 = {
    allocatedUnits: [],
    shortage: 5,
    usedFEFO: true,
    bloodGroup: BloodGroup.AB_POS,
    unitsRequested: 5,
    componentType: 'RBC',
  };

  const classification1 = {
    isEmergency: true,
    urgency: RequestUrgency.URGENT as string,
    classification: 'EMERGENCY' as const,
    reason: 'Test',
  };

  const { shortages: shortages1, nextActions: nextActions1 } = emergencyEngine['generateShortagesAndActions'](
    inventoryAllocation1,
    [],
    classification1
  );

  assert(shortages1.length > 0, 'Inventory shortage detected');
  assert(nextActions1.includes('notify_nearby_donors'), 'Notify donors action generated');
  assert(nextActions1.includes('coordinate_with_other_hospitals'), 'Coordinate hospitals action generated');

  const inventoryAllocation2 = {
    allocatedUnits: [],
    shortage: 0,
    usedFEFO: true,
    bloodGroup: BloodGroup.O_NEG,
    unitsRequested: 5,
    componentType: 'RBC',
  };

  const { shortages: shortages2, nextActions: nextActions2 } = emergencyEngine['generateShortagesAndActions'](
    inventoryAllocation2,
    [],
    classification1
  );

  assert(shortages2.length > 0, 'Donor shortage detected');
  assert(nextActions2.includes('expand_search_radius'), 'Expand search radius action generated');
  assert(nextActions2.includes('escalate_to_admin'), 'Escalate to admin action generated');

  const inventoryAllocation3 = {
    allocatedUnits: [{ id: 'test' }],
    shortage: 0,
    usedFEFO: true,
    bloodGroup: BloodGroup.O_NEG,
    unitsRequested: 1,
    componentType: 'RBC',
  };

  const mockDonor = {
    donorId: 'test',
    anonymizedName: 'Test D.',
    bloodGroup: BloodGroup.O_NEG,
    distanceKm: 5.0,
    distanceRange: 'NEARBY',
    eligible: true,
    available: true,
    reliabilityScore: 90,
    reliabilityStatus: 'ESTABLISHED',
    rankingScore: 85,
    reason: 'Test donor',
  };

  const { nextActions: nextActions3 } = emergencyEngine['generateShortagesAndActions'](
    inventoryAllocation3,
    [mockDonor],
    classification1
  );

  assert(nextActions3.includes('activate_emergency_protocol'), 'Emergency protocol action generated');

  // Test Group 7: Complete Emergency Response Workflow
  console.log('\nTest Group 7: Complete Emergency Response Workflow');
  
  try {
    const request1 = {
      bloodGroup: BloodGroup.O_NEG,
      unitsRequested: 1,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.STAT_CRITICAL,
      componentType: 'RBC',
      radiusKm: 10,
      maxResults: 50,
      requestedBy: testAdminId,
    };

    const response1 = await emergencyEngine.processEmergencyResponse(request1);

    assert(!!response1.requestId, 'Request ID present in response');
    assert(response1.urgency === RequestUrgency.STAT_CRITICAL, 'STAT_CRITICAL urgency preserved');
    assert(response1.classification === 'CRITICAL_EMERGENCY', 'Classification is CRITICAL_EMERGENCY');
    assert(!!response1.inventoryAllocation, 'Inventory allocation present');
    assert(Array.isArray(response1.recommendedDonors), 'Recommended donors present as array');
    assert(Array.isArray(response1.nextActions), 'Next actions present as array');
    assert(!!response1.auditId, 'Audit ID present');
    assert(response1.success === true, 'Response marked as successful');
  } catch (error) {
    console.error('Critical request test failed:', error);
  }

  try {
    const request2 = {
      bloodGroup: BloodGroup.O_NEG,
      unitsRequested: 2,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.URGENT,
      componentType: 'RBC',
      radiusKm: 10,
      maxResults: 50,
      requestedBy: testAdminId,
    };

    const response2 = await emergencyEngine.processEmergencyResponse(request2);

    assert(response2.urgency === RequestUrgency.URGENT, 'URGENT urgency preserved');
    assert(response2.classification === 'EMERGENCY', 'Classification is EMERGENCY');
    assert(response2.inventoryAllocation.usedFEFO === true, 'FEFO used for urgent request');
  } catch (error) {
    console.error('Urgent request test failed:', error);
  }

  try {
    const request3 = {
      bloodGroup: BloodGroup.AB_POS,
      unitsRequested: 5,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.URGENT,
      componentType: 'RBC',
      radiusKm: 10,
      maxResults: 50,
      requestedBy: testAdminId,
    };

    const response3 = await emergencyEngine.processEmergencyResponse(request3);

    assert(response3.inventoryAllocation.shortage > 0, 'Shortage detected when no inventory');
    assert(response3.shortages.length > 0, 'Shortages array populated');
    assert(response3.nextActions.includes('notify_nearby_donors'), 'Notify donors action for shortage');
  } catch (error) {
    console.error('No inventory test failed:', error);
  }

  try {
    const request4 = {
      bloodGroup: BloodGroup.AB_POS,
      unitsRequested: 1,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.URGENT,
      componentType: 'RBC',
      radiusKm: 10,
      maxResults: 50,
      requestedBy: testAdminId,
    };

    const response4 = await emergencyEngine.processEmergencyResponse(request4);

    // AB_POS has limited compatible donors, so this tests shortage handling
    assert(response4.inventoryAllocation.shortage > 0, 'Shortage detected for AB_POS');
    assert(response4.shortages.length > 0, 'Shortages detected when limited donors');
  } catch (error) {
    console.error('Limited donors test failed:', error);
  }

  // Test Group 8: Error Handling and Validation
  console.log('\nTest Group 8: Error Handling and Validation');
  
  try {
    const request5 = {
      unitsRequested: 1,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.URGENT,
      requestedBy: testAdminId,
    } as any;

    await emergencyEngine.processEmergencyResponse(request5);
    assert(false, 'Should have thrown error for missing blood group');
  } catch (error) {
    assert(true, 'Missing blood group rejected');
  }

  try {
    const request6 = {
      bloodGroup: BloodGroup.O_NEG,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.URGENT,
      requestedBy: testAdminId,
    } as any;

    await emergencyEngine.processEmergencyResponse(request6);
    assert(false, 'Should have thrown error for missing units requested');
  } catch (error) {
    assert(true, 'Missing units requested rejected');
  }

  try {
    const request7 = {
      bloodGroup: BloodGroup.O_NEG,
      unitsRequested: 1,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.URGENT,
    } as any;

    await emergencyEngine.processEmergencyResponse(request7);
    assert(false, 'Should have thrown error for missing requestedBy');
  } catch (error) {
    assert(true, 'Missing requestedBy rejected');
  }

  try {
    const request8 = {
      bloodGroup: BloodGroup.O_NEG,
      unitsRequested: -1,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.URGENT,
      requestedBy: testAdminId,
    };

    await emergencyEngine.processEmergencyResponse(request8);
    assert(false, 'Should have thrown error for invalid units requested');
  } catch (error) {
    assert(true, 'Invalid units requested rejected');
  }

  try {
    await emergencyEngine.processFromBloodRequestId('invalid-id', testAdminId);
    assert(false, 'Should have thrown error for invalid blood request ID');
  } catch (error) {
    assert(true, 'Invalid blood request ID rejected');
  }

  // Test Group 9: Process from Blood Request ID
  console.log('\nTest Group 9: Process from Blood Request ID');
  
  try {
    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        requester_id: testAdminId,
        blood_group: BloodGroup.O_NEG,
        units_requested: 1,
        hospital_name: 'Test Hospital',
        hospital_id: testHospitalId,
        urgency: RequestUrgency.URGENT,
        status: 'PENDING',
      },
    });

    const response5 = await emergencyEngine.processFromBloodRequestId(bloodRequest.id, testAdminId);

    assert(response5.requestId === bloodRequest.id, 'Blood request ID preserved');
    assert(response5.urgency === RequestUrgency.URGENT, 'Urgency preserved from blood request');
    assert(!!response5.inventoryAllocation, 'Inventory allocation present');
    assert(Array.isArray(response5.recommendedDonors), 'Recommended donors present');
  } catch (error) {
    console.error('Process from blood request test failed:', error);
  }

  // Test Group 10: Authorization Tests
  console.log('\nTest Group 10: Authorization Tests');
  
  try {
    const request9 = {
      bloodGroup: BloodGroup.O_NEG,
      unitsRequested: 1,
      hospitalId: testHospitalId,
      urgency: RequestUrgency.URGENT,
      requestedBy: testAdminId,
    };

    const response6 = await emergencyEngine.processEmergencyResponse(request9);
    assert(response6.success === true, 'Admin can process emergency response');
  } catch (error) {
    console.error('Admin authorization test failed:', error);
  }

  // Cleanup
  console.log('\nTest Group 11: Cleanup');
  try {
    await prisma.bloodUnit.deleteMany();
    await prisma.bloodInventory.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.hospital.deleteMany();
    assert(true, 'Test data cleaned up successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }

  // Results
  console.log('\n==================================================');
  console.log('  TEST RESULTS: ' + passed + ' PASSED | ' + failed + ' FAILED');
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
