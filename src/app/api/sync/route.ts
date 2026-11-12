import { handler } from '@/lib/route';
import { syncCases } from '@/services/syncCases';
import { getDb } from '@/db/client';
import { createPayPal } from '@/integrations/paypal';

export const dynamic = 'force-dynamic';

export const POST = handler({
  run: async () => {
    const db = getDb();
    const paypal = createPayPal();
    const result = await syncCases(db, paypal);
    return result;
  },
});

