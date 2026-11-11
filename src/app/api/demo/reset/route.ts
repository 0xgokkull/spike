import { handler } from '@/lib/route';
import { clock } from '@/lib/clock';
import { env } from '@/lib/env';
import { AppError } from '@/lib/errors';

export const POST = handler({
  run: async () => {
    if (!env.DEMO_MODE) {
      throw new AppError('FORBIDDEN_DEMO', 'Demo endpoints are disabled in production mode');
    }

    clock.setOffsetDays(0);

    return {
      ok: true,
      today: clock.todayIso(),
      offsetDays: 0,
    };
  },
});

