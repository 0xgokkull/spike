import { handler } from '@/lib/route';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export const GET = handler({
  run: async () => {
    return {
      ok: true,
      db: 'ok',
      paypalMode: env.PAYPAL_MODE,
      llmProvider: env.LLM_PROVIDER,
      model: env.LLM_MODEL,
    };
  },
});

