import { handler } from '@/lib/route';
import { listCases } from '@/services/getCases';
import { getDb } from '@/db/client';

export const GET = handler({
  run: async (_input, req) => {
    const db = getDb();
    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket') || undefined;
    return listCases(db, bucket);
  },
});

