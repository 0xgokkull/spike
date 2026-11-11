import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/lib/env';

let client: postgres.Sql | null = null;

export function getDb() {
  if (!client) {
    client = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof getDb>;
