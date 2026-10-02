const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Fixed UUIDs so default accounts are easy to reference in docs, Postman, etc.
const DEFAULT_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Default Citizen',
    email: 'citizen@smartcityhub.test',
    password: 'Citizen@123',
    role: 'CITIZEN',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Default Department Manager',
    email: 'manager@smartcityhub.test',
    password: 'Manager@123',
    role: 'DEPT_MANAGER',
    department: 'Public Works',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Default City Admin',
    email: 'admin@smartcityhub.test',
    password: 'Admin@123',
    role: 'CITY_ADMIN',
  },
];

async function main() {
  for (const user of DEFAULT_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        department: user.department || null,
        // Seeded/default accounts are pre-approved, unlike self-registered users
        approvalStatus: 'APPROVED',
      },
    });

    console.log(`Seeded ${user.role}: ${user.email} (id: ${user.id}, password: ${user.password})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
