import type { ActionExecutor, ExecutionContext } from './types';
import type { ActionResult } from '@/integrations/paypal/port';
import { AppError } from '@/lib/errors';

export interface AcceptClaimInput {
  note?: string;
  requestId?: string;
}

export const acceptClaimExecutor: ActionExecutor<AcceptClaimInput> = {
  type: 'accept_claim',
  async run(input: AcceptClaimInput, ctx: ExecutionContext): Promise<ActionResult> {
    const disputeId = ctx.paypalDisputeId;
    if (!disputeId) {
      throw new AppError('PAYPAL_ERROR', `Cannot accept claim: case ${ctx.caseId} has no paypal_dispute_id`);
    }

    return ctx.paypal.acceptClaim({
      disputeId,
      note: input.note || 'Conceding dispute claim to buyer',
      requestId: input.requestId,
    });
  },
};

