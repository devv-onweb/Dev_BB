import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';
import { Role, BloodGroup, DonationStatus, RequestUrgency, RequestStatus } from '../src/types/enums.js';

async function main() {
  console.log('🌱 Starting database seeding with Indian Hospital & Patient Data...');

  // 1. Clean up existing records
  console.log('🧹 Cleaning existing records...');
  await prisma.bloodRequest.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.bloodInventory.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default passwords
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', saltRounds);
  const donorPasswordHash = await bcrypt.hash('DonorPassword123!', saltRounds);
  const patientPasswordHash = await bcrypt.hash('PatientPassword123!', saltRounds);

  // 3. Seed Blood Inventory (all 8 standard blood groups)
  console.log('🩸 Seeding blood inventory...');
  const inventoryData = [
    { blood_group: BloodGroup.A_POS, units_available: 28 },
    { blood_group: BloodGroup.A_NEG, units_available: 12 },
    { blood_group: BloodGroup.B_POS, units_available: 34 },
    { blood_group: BloodGroup.B_NEG, units_available: 8 },
    { blood_group: BloodGroup.AB_POS, units_available: 18 },
    { blood_group: BloodGroup.AB_NEG, units_available: 6 },
    { blood_group: BloodGroup.O_POS, units_available: 52 },
    { blood_group: BloodGroup.O_NEG, units_available: 14 },
  ];

  for (const item of inventoryData) {
    await prisma.bloodInventory.create({
      data: item,
    });
  }

  // 4. Seed Users (Admin, Indian Donors, Indian Patients)
  console.log('👥 Seeding users (Dr. Rajesh Sharma, Indian Donors, Indian Patients)...');

  // 4a. Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma (Medical Director)',
      email: 'admin@bloodbank.org',
      password_hash: adminPasswordHash,
      role: Role.ADMIN,
      phone: '+91-98200-11223',
      blood_group: BloodGroup.O_POS,
    },
  });

  // 4b. Indian Donors
  const donor1 = await prisma.user.create({
    data: {
      name: 'Aarav Patel',
      email: 'donor.aarav@example.com',
      password_hash: donorPasswordHash,
      role: Role.DONOR,
      phone: '+91-98765-43210',
      blood_group: BloodGroup.O_POS,
    },
  });

  const donor2 = await prisma.user.create({
    data: {
      name: 'Pooja Sharma',
      email: 'donor.pooja@example.com',
      password_hash: donorPasswordHash,
      role: Role.DONOR,
      phone: '+91-98111-22334',
      blood_group: BloodGroup.A_POS,
    },
  });

  const donor3 = await prisma.user.create({
    data: {
      name: 'Rohan Kulkarni',
      email: 'donor.rohan@example.com',
      password_hash: donorPasswordHash,
      role: Role.DONOR,
      phone: '+91-99222-33445',
      blood_group: BloodGroup.B_NEG,
    },
  });

  const donor4 = await prisma.user.create({
    data: {
      name: 'Sneha Reddy',
      email: 'donor.sneha@example.com',
      password_hash: donorPasswordHash,
      role: Role.DONOR,
      phone: '+91-98333-44556',
      blood_group: BloodGroup.AB_POS,
    },
  });

  const donor5 = await prisma.user.create({
    data: {
      name: 'Vikram Malhotra',
      email: 'donor.vikram@example.com',
      password_hash: donorPasswordHash,
      role: Role.DONOR,
      phone: '+91-98444-55667',
      blood_group: BloodGroup.O_NEG,
    },
  });

  // 4c. Indian Patients / Hospital Requesters
  const patient1 = await prisma.user.create({
    data: {
      name: 'Amit Verma',
      email: 'patient.amit@example.com',
      password_hash: patientPasswordHash,
      role: Role.PATIENT,
      phone: '+91-97555-66778',
      blood_group: BloodGroup.O_NEG,
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      name: 'Kavita Rao',
      email: 'patient.kavita@example.com',
      password_hash: patientPasswordHash,
      role: Role.PATIENT,
      phone: '+91-98666-77889',
      blood_group: BloodGroup.A_NEG,
    },
  });

  const patient3 = await prisma.user.create({
    data: {
      name: 'Suresh Iyer',
      email: 'patient.suresh@example.com',
      password_hash: patientPasswordHash,
      role: Role.PATIENT,
      phone: '+91-99777-88990',
      blood_group: BloodGroup.B_POS,
    },
  });

  const patient4 = await prisma.user.create({
    data: {
      name: 'Neha Joshi',
      email: 'patient.neha@example.com',
      password_hash: patientPasswordHash,
      role: Role.PATIENT,
      phone: '+91-98888-99001',
      blood_group: BloodGroup.AB_NEG,
    },
  });

  // 5. Seed Donations (Indian Donors)
  console.log('💉 Seeding donations...');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  await prisma.donation.createMany({
    data: [
      {
        donor_id: donor1.id,
        units_donated: 2,
        donation_date: thirtyDaysAgo,
        status: DonationStatus.APPROVED,
      },
      {
        donor_id: donor2.id,
        units_donated: 1,
        donation_date: tenDaysAgo,
        status: DonationStatus.APPROVED,
      },
      {
        donor_id: donor3.id,
        units_donated: 1,
        donation_date: twoDaysAgo,
        status: DonationStatus.PENDING,
      },
      {
        donor_id: donor4.id,
        units_donated: 1,
        donation_date: yesterday,
        status: DonationStatus.REJECTED,
      },
      {
        donor_id: donor5.id,
        units_donated: 1,
        donation_date: new Date(),
        status: DonationStatus.PENDING,
      },
    ],
  });

  // 6. Seed Blood Requests (Indian Hospitals & Patients)
  console.log('📋 Seeding blood requests from Indian Hospitals...');
  await prisma.bloodRequest.createMany({
    data: [
      {
        requester_id: patient1.id,
        blood_group: BloodGroup.O_NEG,
        units_requested: 2,
        hospital_name: 'AIIMS New Delhi - Emergency Trauma Bay 3',
        urgency: RequestUrgency.URGENT,
        status: RequestStatus.PENDING,
      },
      {
        requester_id: patient2.id,
        blood_group: BloodGroup.A_NEG,
        units_requested: 1,
        hospital_name: 'Apollo Hospitals Chennai - OT Room 4',
        urgency: RequestUrgency.NORMAL,
        status: RequestStatus.PENDING,
      },
      {
        requester_id: patient3.id,
        blood_group: BloodGroup.B_POS,
        units_requested: 3,
        hospital_name: 'Fortis Memorial Research Institute Gurugram - ICU Ward 2',
        urgency: RequestUrgency.URGENT,
        status: RequestStatus.PENDING,
      },
      {
        requester_id: patient4.id,
        blood_group: BloodGroup.AB_POS,
        units_requested: 2,
        hospital_name: 'Tata Memorial Hospital Mumbai - Oncology Wing',
        urgency: RequestUrgency.NORMAL,
        status: RequestStatus.APPROVED,
      },
      {
        requester_id: patient1.id,
        blood_group: BloodGroup.O_POS,
        units_requested: 2,
        hospital_name: 'Manipal Hospital Bengaluru - Surgical Ward',
        urgency: RequestUrgency.NORMAL,
        status: RequestStatus.FULFILLED,
      },
      {
        requester_id: patient3.id,
        blood_group: BloodGroup.B_NEG,
        units_requested: 4,
        hospital_name: 'Lilavati Hospital Mumbai - Cardiac Care',
        urgency: RequestUrgency.NORMAL,
        status: RequestStatus.REJECTED,
      },
    ],
  });

  console.log('✅ Seeding with Indian Hospital & Patient data completed!');
  console.log('--------------------------------------------------');
  console.log('Credentials Summary:');
  console.log('👑 Admin:   admin@bloodbank.org         | Password: AdminPassword123!');
  console.log('🩸 Donor:   donor.aarav@example.com     | Password: DonorPassword123!');
  console.log('🩸 Donor:   donor.pooja@example.com     | Password: DonorPassword123!');
  console.log('🏥 Patient: patient.amit@example.com    | Password: PatientPassword123!');
  console.log('🏥 Patient: patient.kavita@example.com  | Password: PatientPassword123!');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
