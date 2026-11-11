import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as schema from '@/db/schema';

export async function createTestDb() {
  const pglite = new PGlite();
  const db = drizzle(pglite, { schema });

  // Read generated migration sql files
  const migrationDir = path.resolve('drizzle');
  if (fs.existsSync(migrationDir)) {
    const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sqlContent = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      const statements = sqlContent
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await pglite.exec(statement);
      }
    }
  }

  return { db, pglite };
}
