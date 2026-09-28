/**
 * GeoDonorMatching.test.ts
 * DEV_D - Phase 5 Geo-Location Donor Matching Unit Tests
 */

import { GeoLocationService } from '../services/geo/GeoLocationService.js';
import { GeoDonorMatchingService } from '../services/geo/GeoDonorMatchingService.js';
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
  console.log('  RUNNING GEO-LOCATION DONOR MATCHING TEST SUITE');
  console.log('==================================================\n');

  // --------------------------------------------------------
  // Test Group 1: Haversine Distance Calculation
  // --------------------------------------------------------
  console.log('Test Group 1: Haversine Distance Calculation Math');

  // AIIMS New Delhi (28.5672, 77.2100) -> Connaught Place Delhi (28.6315, 77.2167)
  // Expected distance ~ 7.15 km
  const cpDistance = GeoLocationService.calculateHaversineDistance(28.5672, 77.2100, 28.6315, 77.2167);
  assert(cpDistance > 6.5 && cpDistance < 8.0, `Haversine distance AIIMS to CP calculated correctly (~7.15 km, got ${cpDistance} km)`);

  const samePointDist = GeoLocationService.calculateHaversineDistance(28.5672, 77.2100, 28.5672, 77.2100);
  assert(samePointDist === 0, 'Distance between identical points is 0.0 km');

  let invalidHandled = false;
  try {
    GeoLocationService.calculateHaversineDistance(100, 200, 28.5672, 77.2100);
  } catch (e) {
    invalidHandled = true;
  }
  assert(invalidHandled, 'Out-of-bounds coordinates throw error');

  // --------------------------------------------------------
  // Test Group 2: Setup Test Donors & Hospital Data
  // --------------------------------------------------------
  console.log('\nTest Group 2: Geo Donor Matching Integration Setup');

  const hospitalLat = 28.5672; // AIIMS Delhi
  const hospitalLon = 77.2100;
  const runId = Date.now();

  // 1. Nearby Compatible & Eligible Donor (2 km away)
  const donor1 = await prisma.user.create({
    data: {
      id: `geo-donor-close-${runId}`,
      name: 'Rahul Sharma',
      email: `rahul.${runId}@test.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'O_NEG',
      latitude: 28.5800, // ~2 km from AIIMS
      longitude: 77.2100,
      location_permission: true,
    },
  });

  // 2. Medium Distance Donor (8 km away)
  const donor2 = await prisma.user.create({
    data: {
      id: `geo-donor-med-${runId}`,
      name: 'Priya Singh',
      email: `priya.${runId}@test.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'O_NEG',
      latitude: 28.6315, // ~7.15 km from AIIMS
      longitude: 77.2167,
      location_permission: true,
    },
  });

  // 3. Far Distance Donor (30 km away)
  const donor3 = await prisma.user.create({
    data: {
      id: `geo-donor-far-${runId}`,
      name: 'Amit Patel',
      email: `amit.${runId}@test.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'O_NEG',
      latitude: 28.8000, // ~30 km away
      longitude: 77.2100,
      location_permission: true,
    },
  });

  // 4. Nearby Incompatible Donor (1 km away, B+ for O- recipient)
  const donor4 = await prisma.user.create({
    data: {
      id: `geo-donor-incompat-${runId}`,
      name: 'Suresh Verma',
      email: `suresh.${runId}@test.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'B_POS',
      latitude: 28.5700,
      longitude: 77.2100,
      location_permission: true,
    },
  });

  // 5. Nearby Ineligible Donor (1 km away, O- blood, but donated 10 days ago)
  const donor5 = await prisma.user.create({
    data: {
      id: `geo-donor-ineligible-${runId}`,
      name: 'Vikas Kumar',
      email: `vikas.${runId}@test.com`,
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
      id: `don-recent-geo-${runId}`,
      donor_id: donor5.id,
      units_donated: 1,
      donation_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      status: 'APPROVED',
    },
  });

  // 6. Nearby Donor without Location Permission
  const donor6 = await prisma.user.create({
    data: {
      id: `geo-donor-noconsent-${runId}`,
      name: 'Neha Gupta',
      email: `neha.${runId}@test.com`,
      password_hash: 'hash',
      role: 'DONOR',
      blood_group: 'O_NEG',
      latitude: 28.5720,
      longitude: 77.2100,
      location_permission: false,
    },
  });

  assert(donor1 && donor2 && donor3 && donor4 && donor5 && donor6, 'Test donors created successfully');

  // --------------------------------------------------------
  // Test Group 3: Geo Donor Matching Engine Queries
  // --------------------------------------------------------
  console.log('\nTest Group 3: Radius, Compatibility, & Eligibility Matching');

  const testDonorIds = [donor1.id, donor2.id, donor3.id, donor4.id, donor5.id, donor6.id];

  const match10km = await GeoDonorMatchingService.findNearbyDonors({
    bloodGroup: 'O_NEG',
    latitude: hospitalLat,
    longitude: hospitalLon,
    radiusKm: 10,
  });

  const matchedTestDonors10km = match10km.matched_donors.filter((d) => testDonorIds.includes(d.donor_id));

  assert(match10km.success === true, 'Geo matching query succeeded');
  assert(matchedTestDonors10km.length === 2, `Matches 2 donors within 10km (got ${matchedTestDonors10km.length})`);

  const matchedIds = matchedTestDonors10km.map((d) => d.donor_id);
  assert(matchedIds.includes(donor1.id), 'Close eligible donor (2km) included');
  assert(matchedIds.includes(donor2.id), 'Medium eligible donor (7km) included');
  assert(!matchedIds.includes(donor3.id), 'Far donor (30km) excluded');
  assert(!matchedIds.includes(donor4.id), 'Incompatible B+ donor excluded for O- recipient');
  assert(!matchedIds.includes(donor5.id), 'Ineligible recent donor (<56d) excluded');
  assert(!matchedIds.includes(donor6.id), 'Donor without location consent excluded');

  // --------------------------------------------------------
  // Test Group 4: Privacy & Anonymization Verification
  // --------------------------------------------------------
  console.log('\nTest Group 4: Privacy & Anonymization Safeguards');

  const matchedDonor = match10km.matched_donors[0];
  assert(matchedDonor.anonymized_name === 'Rahul S.', `Donor name anonymized to '${matchedDonor.anonymized_name}'`);
  assert((matchedDonor as any).latitude === undefined, 'Exact latitude omitted from response payload');
  assert((matchedDonor as any).longitude === undefined, 'Exact longitude omitted from response payload');
  assert((matchedDonor as any).address === undefined, 'Exact street address omitted from response payload');
  assert(typeof matchedDonor.approximate_distance_km === 'number', 'Approximate distance returned');

  // --------------------------------------------------------
  // Test Group 5: Tight Radius Query (3 km)
  // --------------------------------------------------------
  console.log('\nTest Group 5: Tight Radius Filter (3 km)');

  const match3km = await GeoDonorMatchingService.findNearbyDonors({
    bloodGroup: 'O_NEG',
    latitude: hospitalLat,
    longitude: hospitalLon,
    radiusKm: 3,
  });

  const matchedTestDonors3km = match3km.matched_donors.filter((d) => testDonorIds.includes(d.donor_id));

  assert(matchedTestDonors3km.length === 1, `Only 1 donor matched within 3km (got ${matchedTestDonors3km.length})`);
  assert(matchedTestDonors3km[0].donor_id === donor1.id, 'Closest donor matched');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
