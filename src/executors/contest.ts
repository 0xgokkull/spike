import type { ActionExecutor, ExecutionContext } from './types';
import type { ActionResult } from '@/integrations/paypal/port';
import { buildEvidencePackage } from '@/agent/evidencePackage';
import { AppError } from '@/lib/errors';

export interface ContestInput {
  narrative?: string;
}

export const contestExecutor: ActionExecutor<ContestInput> = {
  type: 'contest',
  async run(input: ContestInput, ctx: ExecutionContext): Promise<ActionResult> {
    const disputeId = ctx.paypalDisputeId;
    if (!disputeId) {
      throw new AppError('PAYPAL_ERROR', `Cannot contest: case ${ctx.caseId} has no paypal_dispute_id`);
    }

    const { evidences, files } = await buildEvidencePackage({
      order: ctx.order,
      narrative: input.narrative,
    });

    return ctx.paypal.provideEvidence({
      disputeId,
      evidences,
      files,
    });
  },
};

