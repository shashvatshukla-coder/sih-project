import dotenv from 'dotenv';
dotenv.config();

let prismaInstance: any = null;
let isConnected = false;

export async function getPrismaClient() {
  if (prismaInstance) return prismaInstance;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[Prisma] No DATABASE_URL configured. Running in high-performance JSON / In-Memory Database mode.');
    return null;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });

    await prismaInstance.$connect();
    isConnected = true;
    console.log('[Prisma] Successfully connected to PostgreSQL database.');
    return prismaInstance;
  } catch (err) {
    console.warn('[Prisma] Could not connect to PostgreSQL database. Falling back to in-memory JSON data:', (err as any).message || err);
    prismaInstance = null;
    isConnected = false;
    return null;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}
