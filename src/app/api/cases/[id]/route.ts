import { handler } from '@/lib/route';
import { getCaseDetail } from '@/services/getCases';
import { getDb } from '@/db/client';

export const dynamic = 'force-dynamic';

export const GET = handler({
  run: async (_input, req) => {
    const db = getDb();
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf('cases') + 1];
    return getCaseDetail(db, id);
  },
});

