import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

export function createTestDb(): { prisma: PrismaClient; cleanup: () => Promise<void> } {
  const dbFile = path.join(process.cwd(), `test-${randomUUID()}.db`);
  const url = `file:${dbFile}`;

  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore',
  });

  const prisma = new PrismaClient({ datasources: { db: { url } } });

  const cleanup = async () => {
    await prisma.$disconnect();
    fs.rmSync(dbFile, { force: true });
    fs.rmSync(`${dbFile}-journal`, { force: true });
  };

  return { prisma, cleanup };
}
