import type { ActionType } from '@/domain/types';
import type { PayPalPort, ActionResult } from '@/integrations/paypal/port';

export interface ExecutionContext {
  caseId: string;
  paypal: PayPalPort;
  order: {
    id: string;
    item: string;
    amount_cents: number;
    currency: string;
    paypal_order_id?: string | null;
    paypal_capture_id?: string | null;
    carrier?: string | null;
    tracking_number?: string | null;
    tracking_status: string;
    delivered_at?: Date | string | null;
  };
  paypalDisputeId?: string | null;
  actor: 'agent_auto' | 'seller';
}

export interface ActionExecutor<TInput = any> {
  readonly type: ActionType;
  run(input: TInput, ctx: ExecutionContext): Promise<ActionResult>;
}
