import { z } from 'zod';
import { handler } from '@/lib/route';
import { getDayCloseStatus, closeDay } from '@/services/closeDay';
import { getDb } from '@/db/client';

export const dynamic = 'force-dynamic';

export const GET = handler({
  run: async () => {
    const db = getDb();
    return getDayCloseStatus(db);
  },
});

const CloseDaySchema = z.object({
  acknowledgedActionIds: z.array(z.string()).default([]),
});

export const POST = handler({
  inputSchema: CloseDaySchema,
  run: async (input) => {
    const db = getDb();
    return closeDay(db, input.acknowledgedActionIds);
  },
});

