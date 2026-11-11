import type { ActionExecutor, ExecutionContext } from './types';
import type { ActionResult } from '@/integrations/paypal/port';

export interface ReplyInput {
  message?: string;
}

export const replyExecutor: ActionExecutor<ReplyInput> = {
  type: 'reply',
  async run(input: ReplyInput, _ctx: ExecutionContext): Promise<ActionResult> {
    // Local-only action, no PayPal call
    return {
      ok: true,
      refs: {
        replyMessageSent: 'true',
        chars: String((input.message || '').length),
      },
      simulated: false,
    };
  },
};

