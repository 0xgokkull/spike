import type { ActionExecutor, ExecutionContext } from './types';
import type { ActionResult } from '@/integrations/paypal/port';
import { AppError } from '@/lib/errors';

export interface RefundInput {
  amountCents?: number;
  note?: string;
  requestId?: string;
}

export const refundExecutor: ActionExecutor<RefundInput> = {
  type: 'refund',
  async run(input: RefundInput, ctx: ExecutionContext): Promise<ActionResult> {
    const captureId = ctx.order.paypal_capture_id;
    if (!captureId) {
      throw new AppError('PAYPAL_ERROR', `Cannot refund: missing paypal_capture_id for order ${ctx.order.id}`);
    }

    const reqId = input.requestId || `req-ref-${ctx.caseId.slice(0, 8)}-${Date.now()}`;
    return ctx.paypal.refundCapture({
      captureId,
      amountCents: input.amountCents,
      currency: ctx.order.currency,
      requestId: reqId,
      note: input.note || 'Refund issued under merchant policy',
    });
  },
};

