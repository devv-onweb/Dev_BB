/**
 * DemandPrediction.test.ts
 * DEV_D - Phase 11 Blood Demand Prediction Unit Tests
 */

import { DemandPredictionService } from '../services/prediction/DemandPredictionService.js';
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
  console.log('  RUNNING BLOOD DEMAND PREDICTION TEST SUITE');
  console.log('==================================================\n');

  const runId = Date.now();

  // --------------------------------------------------------
  // Test Group 1: Insufficient Data / Empty Dataset Handling
  // --------------------------------------------------------
  console.log('Test Group 1: Insufficient Historical Data Handling');

  const emptyForecast = await DemandPredictionService.getForecast(7, { hospitalId: `non-existent-hosp-${runId}` });

  assert(emptyForecast.status === 'INSUFFICIENT_DATA', 'Insufficient data status returned');
  assert(emptyForecast.confidenceLevel === 'INSUFFICIENT_DATA', 'Confidence level set to INSUFFICIENT_DATA');
  assert(emptyForecast.totalPredictedUnits === 0, 'No fake predictions generated (0 total predicted units)');
  assert(emptyForecast.message.includes('Insufficient'), 'Safe explanation message returned');

  // --------------------------------------------------------
  // Test Group 2: Setup Test Historical Request & Inventory Data
  // --------------------------------------------------------
  console.log('\nTest Group 2: Setup Historical Request Dataset');

  const testHospital = await prisma.hospital.create({
    data: {
      id: `hosp-pred-${runId}`,
      name: `Prediction Test Hospital ${runId}`,
      address: 'Future Way',
      contact_number: '+91-11-30000001',
      emergency_contact: '+91-11-30000002',
    },
  });

  const testUser = await prisma.user.create({
    data: {
      id: `user-pred-${runId}`,
      name: 'Prediction User',
      email: `pred.${runId}@test.com`,
      password_hash: 'hash',
      role: 'PATIENT',
    },
  });

  // Create historical blood requests spanning 15 days
  const baseTime = Date.now() - 14 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < 10; i++) {
    await prisma.bloodRequest.create({
      data: {
        id: `req-pred-${i}-${runId}`,
        requester_id: testUser.id,
        blood_group: i % 2 === 0 ? 'O_NEG' : 'A_POS',
        units_requested: (i % 3) + 1,
        hospital_name: testHospital.name,
        hospital_id: testHospital.id,
        urgency: i % 4 === 0 ? 'URGENT' : 'NORMAL',
        status: 'FULFILLED',
        created_at: new Date(baseTime + i * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Create inventory record with low stock for shortage warning test
  await prisma.bloodInventory.create({
    data: {
      id: `inv-pred-oneg-${runId}`,
      blood_group: 'O_NEG',
      units_available: 1, // Only 1 unit available -> expected shortage
    },
  });

  assert(testHospital && testUser, 'Historical prediction dataset created');

  // --------------------------------------------------------
  // Test Group 3: 7-Day & 30-Day Demand Forecasts
  // --------------------------------------------------------
  console.log('\nTest Group 3: 7-Day & 30-Day Statistical Demand Forecast');

  const forecast7 = await DemandPredictionService.getForecast(7, { hospitalId: testHospital.id });

  assert(forecast7.status === 'SUCCESS', '7-day forecast computed successfully');
  assert(forecast7.confidenceLevel === 'MEDIUM', `Confidence level evaluated as MEDIUM (got ${forecast7.confidenceLevel})`);
  assert(forecast7.dailyForecastPoints.length === 7, 'Generates exactly 7 daily forecast points');
  assert(forecast7.totalPredictedUnits > 0, `Total predicted 7-day units > 0 (got ${forecast7.totalPredictedUnits})`);
  assert(forecast7.dailyAverageUnits > 0, `Daily average units > 0 (got ${forecast7.dailyAverageUnits})`);

  const forecast30 = await DemandPredictionService.getForecast(30, { hospitalId: testHospital.id });
  assert(forecast30.status === 'SUCCESS', '30-day forecast computed successfully');
  assert(forecast30.dailyForecastPoints.length === 30, 'Generates exactly 30 daily forecast points');
  assert(forecast30.totalPredictedUnits > forecast7.totalPredictedUnits, '30-day forecast > 7-day forecast');

  // --------------------------------------------------------
  // Test Group 4: Blood Group Demand Breakdown Forecast
  // --------------------------------------------------------
  console.log('\nTest Group 4: Blood Group Demand Breakdown Forecast');

  const bgForecasts = await DemandPredictionService.getBloodGroupForecast({ hospitalId: testHospital.id });

  assert(bgForecasts.length === 8, 'Forecast generated for all 8 blood groups');

  const oNegForecast = bgForecasts.find((b) => b.bloodGroup === 'O_NEG');
  assert(oNegForecast !== undefined, 'O_NEG blood group forecast present');
  assert(oNegForecast !== undefined && oNegForecast.historicalSharePct > 0, 'Historical share % computed for O_NEG');
  assert(oNegForecast !== undefined && oNegForecast.predictedUnits7Days > 0, '7-day predicted units computed for O_NEG');

  // --------------------------------------------------------
  // Test Group 5: Shortage Warning Alerts
  // --------------------------------------------------------
  console.log('\nTest Group 5: Shortage Warning Alerts');

  const shortageWarnings = await DemandPredictionService.getShortageWarnings({ hospitalId: testHospital.id });

  assert(shortageWarnings.length > 0, 'Shortage warnings generated');

  const criticalWarning = shortageWarnings.find((w) => w.bloodGroup === 'O_NEG');
  assert(criticalWarning !== undefined, 'O_NEG shortage warning evaluated');
  assert(criticalWarning !== undefined && criticalWarning.shortageRiskLevel === 'CRITICAL', `O_NEG risk level set to CRITICAL (got ${criticalWarning?.shortageRiskLevel})`);
  assert(criticalWarning !== undefined && criticalWarning.recommendedAction.includes('CRITICAL SHORTAGE WARNING'), 'Actionable recommendation generated');

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
