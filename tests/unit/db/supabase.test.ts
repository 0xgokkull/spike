import { describe, it, expect } from 'vitest';
import { getSupabase } from '@/db/supabase';

describe('Supabase client module', () => {
  it('returns null if supabase env vars are not set', () => {
    const client = getSupabase();
    // In test environment without NEXT_PUBLIC_SUPABASE_URL, it returns null
    expect(client).toBeNull();
  });
});

