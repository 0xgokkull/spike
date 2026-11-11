import type { ActionType } from '@/domain/types';
import type { ActionExecutor } from './types';
import { refundExecutor } from './refund';
import { contestExecutor } from './contest';
import { acceptClaimExecutor } from './acceptClaim';
import { replyExecutor } from './reply';
import { AppError } from '@/lib/errors';

const REGISTRY: Record<ActionType, ActionExecutor> = {
  refund: refundExecutor,
  contest: contestExecutor,
  accept_claim: acceptClaimExecutor,
  reply: replyExecutor,
};

export function getExecutor(type: ActionType): ActionExecutor {
  const executor = REGISTRY[type];
  if (!executor) {
    throw new AppError('ACTION_NOT_AVAILABLE', `No executor registered for action type: ${type}`);
  }
  return executor;
}
