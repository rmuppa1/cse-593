const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const defaultUsers = [
  {
    id: 'default-citizen-id',
    name: 'Default Citizen',
    email: 'citizen@smartcity.com',
    password: 'password123',
    role: 'CITIZEN',
    department: null,
  },
  {
    id: 'default-admin-id',
    name: 'Default City Admin',
    email: 'admin@smartcity.com',
    password: 'password123',
    role: 'CITY_ADMIN',
    department: 'ADMINISTRATION',
  },
  {
    id: 'default-manager-id',
    name: 'Default Dept Manager',
    email: 'manager@smartcity.com',
    password: 'password123',
    role: 'DEPT_MANAGER',
    department: 'PUBLIC_WORKS',
  },
];

async function main() {
  console.log('Seeding default users for every role...');

  for (const user of defaultUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        id: user.id,
        name: user.name,
        password: hashedPassword,
        role: user.role,
        department: user.department,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        department: user.department,
      },
    });

    console.log(`Created/Updated ${user.role} user:`, {
      id: upsertedUser.id,
      email: upsertedUser.email,
      role: upsertedUser.role,
      department: upsertedUser.department,
    });
  }

  console.log('Finished seeding default users.');
}

main()
  .catch((e) => {
    console.error('Error seeding default users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
