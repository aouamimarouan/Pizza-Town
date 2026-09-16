import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configure database URL with safe connection limits.
 * Prevents "FATAL: too many connections for role" errors on cloud-hosted databases
 * by capping the Prisma client pool size.
 */
const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL || process.env.POSTGRESQL_ADDON_URI || '';
  if (!url) return url;

  // If connection_limit is not already configured in DATABASE_URL, append safe connection pool limits
  if (!url.includes('connection_limit=')) {
    const separator = url.includes('?') ? '&' : '?';
    const limit = process.env.DB_CONNECTION_LIMIT || '5';
    url = `${url}${separator}connection_limit=${limit}&pool_timeout=10`;
  }
  return url;
};

// Singleton pattern to prevent multiple instances
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

