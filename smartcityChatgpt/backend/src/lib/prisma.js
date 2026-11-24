import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__smartCityPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.__smartCityPrisma = prisma;

export default prisma;

