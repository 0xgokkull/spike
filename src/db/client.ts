import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/lib/env';

let client: postgres.Sql | null = null;

export function getDb() {
  if (!client) {
    const isRemote = env.DATABASE_URL.includes('supabase.co') || Boolean(process.env.VERCEL);
    client = postgres(env.DATABASE_URL, {
      max: process.env.VERCEL ? 2 : 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Essential for Supabase transaction pooler and Vercel serverless functions
      ssl: isRemote ? 'require' : false,
    });
  }
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof getDb>;

