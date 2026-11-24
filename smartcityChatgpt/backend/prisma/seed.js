import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const daysFromNow = (days, hour = 10) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d; };

async function main() {
  const password = await bcrypt.hash('Password123!', 12);
  const approvedAt = new Date();
  const admin = await prisma.user.upsert({ where: { email: 'admin@smartcity.gov' }, update: { approvalStatus: 'APPROVED', requestedRole: 'ADMIN', approvedAt }, create: { name: 'Jordan Lee', email: 'admin@smartcity.gov', password, role: 'ADMIN', requestedRole: 'ADMIN', approvalStatus: 'APPROVED', approvedAt, department: 'City Operations' } });
  const manager = await prisma.user.upsert({ where: { email: 'manager@smartcity.gov' }, update: { approvalStatus: 'APPROVED', requestedRole: 'MANAGER', requestedDepartment: 'Public Works', approvedAt }, create: { name: 'Morgan Chen', email: 'manager@smartcity.gov', password, role: 'MANAGER', requestedRole: 'MANAGER', requestedDepartment: 'Public Works', approvalStatus: 'APPROVED', approvedAt, department: 'Public Works' } });
  const citizen = await prisma.user.upsert({ where: { email: 'citizen@example.com' }, update: { approvalStatus: 'APPROVED', requestedRole: 'CITIZEN', approvedAt }, create: { name: 'Alex Rivera', email: 'citizen@example.com', password, role: 'CITIZEN', requestedRole: 'CITIZEN', approvalStatus: 'APPROVED', approvedAt } });

  if (await prisma.event.count() === 0) {
    await prisma.event.createMany({ data: [
      { title: 'Riverfront Cleanup Day', description: 'Join neighbors to restore the riverfront trail and protect our local watershed.', category: 'ENVIRONMENT', type: 'IN_PERSON', location: 'Riverfront Park', address: '101 River Walk', startsAt: daysFromNow(5, 9), endsAt: daysFromNow(5, 12), isFree: true, capacity: 120, featured: true, creatorId: admin.id },
      { title: 'Summer Night Market', description: 'Celebrate local makers, food vendors, musicians, and artists under the city lights.', category: 'CULTURAL_ACTIVITIES', type: 'IN_PERSON', location: 'Civic Plaza', address: '1 City Center', startsAt: daysFromNow(8, 17), endsAt: daysFromNow(8, 21), isFree: true, capacity: 500, featured: true, creatorId: admin.id },
      { title: 'Community CPR Workshop', description: 'Learn hands-only CPR and emergency response skills from city paramedics.', category: 'PUBLIC_SAFETY', type: 'IN_PERSON', location: 'Central Library', address: '240 Main Street', startsAt: daysFromNow(12, 11), endsAt: daysFromNow(12, 13), isFree: true, capacity: 40, creatorId: admin.id },
      { title: 'Youth Soccer Skills Clinic', description: 'A friendly skills session for young athletes led by local college players.', category: 'SPORTS', type: 'IN_PERSON', location: 'Meadowview Fields', address: '81 Green Avenue', startsAt: daysFromNow(15, 8), endsAt: daysFromNow(15, 11), isFree: false, price: 10, capacity: 80, creatorId: admin.id },
      { title: 'Digital Skills for Everyone', description: 'A practical class covering online safety, city services, and everyday technology.', category: 'EDUCATION', type: 'HYBRID', location: 'Innovation Center', address: '16 Market Street', startsAt: daysFromNow(19, 18), endsAt: daysFromNow(19, 20), isFree: true, capacity: 60, creatorId: admin.id },
      { title: 'Neighborhood Food Drive', description: 'Help sort and pack pantry staples for families across our community.', category: 'COMMUNITY_SERVICE', type: 'IN_PERSON', location: 'Northside Center', address: '455 Oak Road', startsAt: daysFromNow(22, 10), endsAt: daysFromNow(22, 14), isFree: true, capacity: 100, creatorId: admin.id },
    ] });
  }

  if (await prisma.serviceRequest.count() === 0) {
    await prisma.serviceRequest.createMany({ data: [
      { reference: 'SC-2026-A4F91C', title: 'Large pothole near crosswalk', description: 'Deep pothole in the eastbound lane creates a hazard for cyclists.', issueType: 'POTHOLE', status: 'IN_PROGRESS', priority: 'HIGH', location: 'Main St & 4th Ave', department: 'Public Works', assignedToName: 'Taylor Brooks', citizenId: citizen.id, managerId: manager.id },
      { reference: 'SC-2026-B7D22K', title: 'Streetlight is out', description: 'The light has been dark for three nights near the bus stop.', issueType: 'BROKEN_STREETLIGHT', status: 'ASSIGNED', priority: 'MEDIUM', location: '800 block of Pine Street', department: 'Public Works', assignedToName: 'Casey Nguyen', citizenId: citizen.id, managerId: manager.id },
      { reference: 'SC-2026-C1M55P', title: 'Graffiti on park wall', description: 'New graffiti appeared on the west wall by the playground.', issueType: 'GRAFFITI', status: 'PENDING', priority: 'LOW', location: 'Heritage Park playground', citizenId: citizen.id },
    ] });
  }
  await prisma.serviceRequest.updateMany({
    where: { managerId: manager.id, assignedToName: null },
    data: { assignedToName: manager.name },
  });
  console.log('Seeded SmartCity Hub demo data');
}

main().finally(() => prisma.$disconnect());
