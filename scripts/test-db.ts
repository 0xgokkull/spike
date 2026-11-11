import postgres from 'postgres';
import { getSupabase } from '../src/db/supabase';

async function main() {
  console.log('--- Testing Database and Supabase Connectivity ---');

  const dbUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`Supabase URL configured: ${supabaseUrl ? 'YES' : 'NO'}`);
  console.log(`Anon Key configured: ${anonKey ? 'YES' : 'NO'}`);
  console.log(`DATABASE_URL configured: ${dbUrl ? 'YES' : 'NO'}`);

  // 1. Test Supabase JS Client
  const supabase = getSupabase();
  if (supabase) {
    console.log('\nTesting Supabase JS Client connection...');
    try {
      const { data, error } = await supabase.from('cases').select('count', { count: 'exact', head: true });
      if (error) {
        console.log(`Supabase client responded with: ${error.message} (code: ${error.code})`);
      } else {
        console.log('Supabase client connected successfully!');
      }
    } catch (err: any) {
      console.log('Supabase client error:', err.message);
    }
  } else {
    console.log('\n(Supabase JS Client skipped: NEXT_PUBLIC_SUPABASE_URL or anon key not yet set in .env.local)');
  }

  // 2. Test Direct Postgres / Supabase connection via DATABASE_URL
  if (dbUrl) {
    console.log('\nTesting direct Postgres connection to DATABASE_URL...');
    try {
      const sql = postgres(dbUrl, { connect_timeout: 5, max: 1 });
      const result = await sql`SELECT 1 as connected, current_database() as db_name, now() as server_time`;
      console.log('Postgres connection successful!');
      console.log(`Connected to database: ${result[0]?.db_name}`);
      console.log(`Server timestamp: ${result[0]?.server_time}`);
      await sql.end();
    } catch (err: any) {
      console.error('Postgres connection failed:', err.message);
    }
  }

  console.log('\nDatabase test finished.');
}

main().catch((err) => {
  console.error('Test script failed:', err.message);
  process.exit(1);
});

