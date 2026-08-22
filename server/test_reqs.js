import prisma from './dist/config/db.js';

async function test() {
  const reqs = await prisma.bloodRequest.findMany({ include: { requester: true } });
  console.log('Total Requests in DB:', reqs.length);
  reqs.forEach((r) => {
    console.log(`[${r.status}] ${r.blood_group} x ${r.units_requested} for ${r.hospital_name} (By: ${r.requester?.name})`);
  });
}

test();
