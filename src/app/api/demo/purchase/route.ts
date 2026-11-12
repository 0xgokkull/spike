import { z } from 'zod';
import { handler } from '@/lib/route';
import { getDb } from '@/db/client';
import { ordersRepo } from '@/db/repos/orders';
import { casesRepo } from '@/db/repos/cases';
import { policiesRepo } from '@/db/repos/policies';
import { createPayPal } from '@/integrations/paypal';
import { createLlm } from '@/integrations/llm';
import { executeAction } from '@/services/executeAction';
import { processCase } from '@/services/processCase';
import { env } from '@/lib/env';
import { AppError } from '@/lib/errors';
import type { DbClient } from '@/db/client';
import type { PolicyRules } from '@/domain/types';

const PurchaseSchema = z.object({
  scenario: z.enum(['earbuds_auto', 'watch_contest', 'keyboard_approval', 'backpack_snooze']),
});

async function ensurePolicy(db: DbClient) {
  let policy = await policiesRepo.getActive(db);
  if (!policy) {
    const rules: PolicyRules = {
      version: 1,
      autoRefundCapCents: 2500,
      autoRefundReasons: ['MERCHANDISE_OR_SERVICE_NOT_RECEIVED', 'OTHER'],
      refundWindowDays: 30,
      clauses: [
        { id: 'P-1', text: 'Refund automatically up to $25 when tracking shows the parcel never arrived or was lost in transit.' },
        { id: 'P-2', text: 'Refund requests exceeding $25 require merchant approval before any funds are disbursed.' },
        { id: 'P-3', text: 'Disputes claiming non-receipt where tracking confirms delivery must be contested with proof of delivery.' },
        { id: 'P-4', text: 'Returns requested within 30 days of delivery are eligible for partial or full refund upon inspection.' },
        { id: 'P-5', text: 'Claims submitted after 30 days from delivery are ineligible for refund.' },
      ],
    };
    policy = await policiesRepo.create(db, {
      version: 1,
      text: 'Standard Merchant Return & Dispute Policy (2026)',
      rules,
      active: true,
    });
  }
  return policy;
}

function buildScenarioData(scenario: string) {
  const now = new Date();
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();

  switch (scenario) {
    case 'earbuds_auto':
      return {
        order: {
          item: 'Wireless Noise-Canceling Earbuds',
          amount_cents: 2000,
          currency: 'USD',
          paypal_order_id: `ORD-EARBUDS-${suffix}`,
          paypal_capture_id: `CAP-LIVE-${suffix}`,
          carrier: 'USPS',
          tracking_number: '9400111899562537',
          tracking_status: 'in_transit' as const,
          shipped_at: new Date(now.getTime() - 5 * 86400000),
          delivered_at: null,
        },
        caseInput: {
          source: 'refund_request' as const,
          reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED' as const,
          buyer_message: 'Hi, tracking has been stuck for 5 days and I never received my earbuds. Can you please refund my $20?',
          amount_cents: 2000,
          currency: 'USD',
          available_actions: ['refund', 'reply'] as ('refund' | 'reply')[],
          simulated: true,
        },
      };
    case 'watch_contest':
      return {
        order: {
          item: 'Vintage Mechanical Watch',
          amount_cents: 12000,
          currency: 'USD',
          paypal_order_id: `ORD-WATCH-${suffix}`,
          paypal_capture_id: `CAP-LIVE-${suffix}`,
          carrier: 'FEDEX',
          tracking_number: '987654321098',
          tracking_status: 'delivered' as const,
          shipped_at: new Date(now.getTime() - 5 * 86400000),
          delivered_at: new Date(now.getTime() - 3 * 86400000),
        },
        caseInput: {
          source: 'dispute' as const,
          paypal_dispute_id: `PP-D-${suffix}`,
          reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED' as const,
          buyer_message: 'I checked my porch and mailbox but the watch is not there. Please refund my $120.',
          amount_cents: 12000,
          currency: 'USD',
          deadline_at: new Date(now.getTime() + 10 * 86400000),
          available_actions: ['contest', 'refund', 'reply'] as ('contest' | 'refund' | 'reply')[],
          simulated: true,
        },
      };
    case 'keyboard_approval':
      return {
        order: {
          item: 'Custom Mechanical Keyboard',
          amount_cents: 8500,
          currency: 'USD',
          paypal_order_id: `ORD-KEYBOARD-${suffix}`,
          paypal_capture_id: `CAP-LIVE-${suffix}`,
          carrier: 'UPS',
          tracking_number: '1Z9999999999999999',
          tracking_status: 'delivered' as const,
          shipped_at: new Date(now.getTime() - 4 * 86400000),
          delivered_at: new Date(now.getTime() - 2 * 86400000),
        },
        caseInput: {
          source: 'refund_request' as const,
          reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED' as const,
          buyer_message: 'The keyboard arrived with two sticky keys. I would like a refund or partial discount.',
          amount_cents: 8500,
          currency: 'USD',
          available_actions: ['refund', 'reply'] as ('refund' | 'reply')[],
          simulated: true,
        },
      };
    default:
      return {
        order: {
          item: 'Leather Travel Backpack',
          amount_cents: 4500,
          currency: 'USD',
          paypal_order_id: `ORD-BACKPACK-${suffix}`,
          paypal_capture_id: `CAP-LIVE-${suffix}`,
          carrier: 'USPS',
          tracking_number: '9400111899562544',
          tracking_status: 'in_transit' as const,
          shipped_at: new Date(now.getTime() - 1 * 86400000),
          delivered_at: null,
        },
        caseInput: {
          source: 'refund_request' as const,
          reason: 'OTHER' as const,
          buyer_message: 'I am traveling tomorrow evening and need confirmation on arrival time.',
          amount_cents: 4500,
          currency: 'USD',
          available_actions: ['reply', 'refund'] as ('reply' | 'refund')[],
          simulated: true,
        },
      };
  }
}

export const POST = handler({
  inputSchema: PurchaseSchema,
  run: async (input) => {
    if (!env.DEMO_MODE) {
      throw new AppError('FORBIDDEN_DEMO', 'Purchase demo endpoint is disabled in production');
    }

    const db = getDb();
    await ensurePolicy(db);

    const { order: orderData, caseInput } = buildScenarioData(input.scenario);
    const order = await ordersRepo.create(db, orderData);

    const newCase = await casesRepo.create(db, {
      ...caseInput,
      order_id: order.id,
    });

    const paypal = createPayPal();
    const llm = createLlm();
    const executeActionFn = async (params: any) => executeAction(db, paypal, params);

    const result = await processCase(db, llm, newCase.id, executeActionFn);

    return {
      ok: true,
      caseId: newCase.id,
      item: order.item,
      amountCents: order.amount_cents,
      recommendation: result.recommendation,
      status: result.case?.status,
    };
  },
});

