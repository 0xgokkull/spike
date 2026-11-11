import { z } from 'zod';
import { handler } from '@/lib/route';
import { clock } from '@/lib/clock';
import { env } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { wakeSnoozed } from '@/services/wakeSnoozed';
import { getDb } from '@/db/client';

const AdvanceDaySchema = z.object({
  days: z.number().int().min(1).default(1),
});

export const POST = handler({
  inputSchema: AdvanceDaySchema,
  run: async (input) => {
    if (!env.DEMO_MODE) {
      throw new AppError('FORBIDDEN_DEMO', 'Demo endpoints are disabled in production mode');
    }

    const daysToAdvance = input?.days ?? 1;
    clock.setOffsetDays(clock.getOffsetDays() + daysToAdvance);

    const db = getDb();
    const wakeResult = await wakeSnoozed(db);

    return {
      now: clock.now().toISOString(),
      today: clock.todayIso(),
      offsetDays: clock.getOffsetDays(),
      wokenCases: wakeResult,
    };
  },
});
