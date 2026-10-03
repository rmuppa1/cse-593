require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const inDays = (n) => new Date(Date.now() + n * 86400000);

async function main() {
  await prisma.eventRSVP.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({ data: { name: 'Alex Admin', email: 'admin@smartcity.test', password: hash, role: 'ADMIN', approved: true } });
  await prisma.user.create({ data: { name: 'Morgan Manager', email: 'manager@smartcity.test', password: hash, role: 'MANAGER', department: 'PUBLIC_WORKS', approved: true } });
  await prisma.user.create({ data: { name: 'Mia Manager', email: 'manager2@smartcity.test', password: hash, role: 'MANAGER', department: 'PARKS_SANITATION', approved: true } });
  const citizen = await prisma.user.create({ data: { name: 'Casey Citizen', email: 'citizen@smartcity.test', password: hash, role: 'CITIZEN', approved: true } });

  const events = [
    ['Riverside Clean-Up Day', 'Join neighbours to clear litter along the river trail.', 'ENVIRONMENT', 'Riverside Park', 5, true, null],
    ['Community Food Drive', 'Volunteer sorting and packing food for local families.', 'COMMUNITY_SERVICE', 'Civic Center Hall', 3, true, null],
    ['City 5K Fun Run', 'Annual charity run through downtown.', 'SPORTS', 'Downtown Plaza', 12, false, 15],
    ['Fire Safety Workshop', 'Learn home fire prevention from the fire department.', 'PUBLIC_SAFETY', 'Fire Station 4', 8, true, null],
    ['Coding for Kids', 'Intro programming workshop for ages 8-12.', 'EDUCATION', 'Central Library', 10, false, 5],
    ['Summer Arts Festival', 'Live music, local artists, and food stalls.', 'CULTURAL', 'Heritage Square', 20, false, 10],
    ['Tree Planting Morning', 'Help plant 200 native trees.', 'ENVIRONMENT', 'Greenfield Park', 15, true, null],
    ['Neighbourhood Watch Meeting', 'Monthly safety update with local police.', 'PUBLIC_SAFETY', 'Community Room B', 2, true, null],
  ];
  const created = [];
  for (const [title, description, category, location, d, isFree, price] of events) {
    created.push(await prisma.event.create({ data: { title, description, category, location, date: inDays(d), isFree, price, capacity: 100, createdById: admin.id } }));
  }
  await prisma.eventRSVP.create({ data: { userId: citizen.id, eventId: created[0].id } });

  const reqs = [
    ['POTHOLE', 'Large pothole on Main St', 'Deep pothole near the bus stop.', '120 Main St', 'PENDING', 'HIGH', null],
    ['STREETLIGHT', 'Streetlight out', 'Light has been out for a week.', 'Oak Ave & 3rd', 'IN_PROGRESS', 'MEDIUM', 'Morgan Manager'],
    ['GRAFFITI', 'Graffiti on library wall', 'Spray paint on the east wall.', 'Central Library', 'RESOLVED', 'LOW', 'Morgan Manager'],
    ['WATER_LEAK', 'Leaking hydrant', 'Water running into the street.', '45 Elm St', 'PENDING', 'HIGH', null],
    ['NOISE', 'Late-night construction noise', 'Work continuing past midnight.', '9 Pine Rd', 'PENDING', 'LOW', null],
  ];
  for (const [type, title, description, location, status, priority, assigneeName] of reqs) {
    await prisma.serviceRequest.create({
      data: { type, title, description, location, status, priority, assigneeName, reporterId: citizen.id, resolvedAt: status === 'RESOLVED' ? new Date() : null },
    });
  }
  console.log('Seeded. Password for all accounts: password123');
  console.log('  admin@smartcity.test / manager@smartcity.test / citizen@smartcity.test');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
