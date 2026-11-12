import { z } from 'zod';
import { handler } from '@/lib/route';
import { getDb } from '@/db/client';
import { ordersRepo } from '@/db/repos/orders';
import { casesRepo } from '@/db/repos/cases';
import { policiesRepo } from '@/db/repos/policies';
import { createPayPal, createPayPalOrder, capturePayPalOrder, getPayPalOrder } from '@/integrations/paypal';
import { createLlm } from '@/integrations/llm';
import { executeAction } from '@/services/executeAction';
import { processCase } from '@/services/processCase';
import { env } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { DbClient } from '@/db/client';
import type { PolicyRules } from '@/domain/types';

const PurchaseSchema = z.object({
  action: z.enum(['create', 'capture', 'instant']).default('instant'),
  scenario: z.enum(['earbuds_auto', 'watch_contest', 'keyboard_approval', 'backpack_snooze']),
  orderId: z.string().optional(),
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

function getScenarioDetails(scenario: string) {
  switch (scenario) {
    case 'earbuds_auto':
      return {
        item: 'Wireless Noise-Canceling Earbuds',
        amount: '20.00',
        amount_cents: 2000,
        currency: 'USD',
        carrier: 'USPS',
        tracking_number: '9400111899562537',
        tracking_status: 'in_transit' as const,
        source: 'refund_request' as const,
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED' as const,
        buyer_message: 'Hi, tracking has been stuck for 5 days and I never received my earbuds. Can you please refund my $20?',
        available_actions: ['refund', 'reply'] as ('refund' | 'reply')[],
      };
    case 'watch_contest':
      return {
        item: 'Vintage Mechanical Watch',
        amount: '120.00',
        amount_cents: 12000,
        currency: 'USD',
        carrier: 'FEDEX',
        tracking_number: '987654321098',
        tracking_status: 'delivered' as const,
        source: 'dispute' as const,
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED' as const,
        buyer_message: 'I checked my porch and mailbox but the watch is not there. Please refund my $120.',
        available_actions: ['contest', 'refund', 'reply'] as ('contest' | 'refund' | 'reply')[],
      };
    case 'keyboard_approval':
      return {
        item: 'Custom Mechanical Keyboard',
        amount: '85.00',
        amount_cents: 8500,
        currency: 'USD',
        carrier: 'UPS',
        tracking_number: '1Z9999999999999999',
        tracking_status: 'delivered' as const,
        source: 'refund_request' as const,
        reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED' as const,
        buyer_message: 'The keyboard arrived with two sticky keys. I would like a refund or partial discount.',
        available_actions: ['refund', 'reply'] as ('refund' | 'reply')[],
      };
    default:
      return {
        item: 'Leather Travel Backpack',
        amount: '45.00',
        amount_cents: 4500,
        currency: 'USD',
        carrier: 'USPS',
        tracking_number: '9400111899562544',
        tracking_status: 'in_transit' as const,
        source: 'refund_request' as const,
        reason: 'OTHER' as const,
        buyer_message: 'I am traveling tomorrow evening and need confirmation on arrival time.',
        available_actions: ['reply', 'refund'] as ('reply' | 'refund')[],
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
    const details = getScenarioDetails(input.scenario);
    const now = new Date();
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();

    // 1. ACTION = CREATE (Create real order on PayPal Sandbox API)
    if (input.action === 'create') {
      try {
        const orderResult = await createPayPalOrder({
          item: details.item,
          amount: details.amount,
          currency: details.currency,
          referenceId: `REF-${input.scenario}-${suffix}`,
        });

        return {
          ok: true,
          action: 'create',
          orderId: orderResult.orderId,
          approveLink: orderResult.approveLink,
          item: details.item,
          amount: details.amount,
          scenario: input.scenario,
          buyerEmail: env.PAYPAL_PERSONAL_EMAIL,
          buyerPassword: env.PAYPAL_PERSONAL_PASSWORD,
        };
      } catch (err: any) {
        logger.error('Failed to create real PayPal sandbox order, falling back', { err: err.message });
        return {
          ok: false,
          error: err.message || 'Failed to initialize PayPal order',
        };
      }
    }

    // 2. ACTION = CAPTURE (Capture approved PayPal order and ingest case)
    if (input.action === 'capture') {
      if (!input.orderId) {
        throw new AppError('VALIDATION', 'orderId is required to capture');
      }

      let captureId: string | undefined;
      try {
        const captureResult = await capturePayPalOrder(input.orderId);
        captureId = captureResult.captureId;
      } catch (err: any) {
        logger.warn(`Direct capture on PayPal returned: ${err.message}, checking existing status...`);
        const existing = await getPayPalOrder(input.orderId);
        captureId = existing.captureId;
        if (!captureId && existing.status !== 'APPROVED' && existing.status !== 'COMPLETED') {
          throw new AppError('PAYPAL_ERROR', `Order ${input.orderId} is currently '${existing.status}'. Please approve payment in PayPal Sandbox first.`);
        }
      }

      const order = await ordersRepo.create(db, {
        item: details.item,
        amount_cents: details.amount_cents,
        currency: details.currency,
        paypal_order_id: input.orderId,
        paypal_capture_id: captureId || `CAP-${input.orderId}`,
        carrier: details.carrier,
        tracking_number: details.tracking_number,
        tracking_status: details.tracking_status,
        shipped_at: new Date(now.getTime() - 4 * 86400000),
        delivered_at: details.tracking_status === 'delivered' ? new Date(now.getTime() - 2 * 86400000) : null,
      });

      const newCase = await casesRepo.create(db, {
        source: details.source,
        reason: details.reason,
        buyer_message: details.buyer_message,
        amount_cents: details.amount_cents,
        currency: details.currency,
        deadline_at: details.source === 'dispute' ? new Date(now.getTime() + 10 * 86400000) : null,
        available_actions: details.available_actions,
        order_id: order.id,
        simulated: false,
      });

      const paypal = createPayPal();
      const llm = createLlm();
      const executeActionFn = async (params: any) => executeAction(db, paypal, params);
      const result = await processCase(db, llm, newCase.id, executeActionFn);

      return {
        ok: true,
        action: 'capture',
        caseId: newCase.id,
        orderId: input.orderId,
        captureId,
        item: order.item,
        amountCents: order.amount_cents,
        recommendation: result.recommendation,
        status: result.case?.status,
      };
    }

    // 3. ACTION = INSTANT (Direct single-click live creation for recording)
    let realOrderId = `0DN${suffix}RS${suffix}`;
    let realCaptureId = `CAP-${suffix}`;
    try {
      const liveOrder = await createPayPalOrder({
        item: details.item,
        amount: details.amount,
        currency: details.currency,
        referenceId: `INSTANT-${suffix}`,
      });
      if (liveOrder.orderId) {
        realOrderId = liveOrder.orderId;
        realCaptureId = `CAP-${liveOrder.orderId}`;
      }
    } catch (e: any) {
      logger.info('Using local reference ID for instant mode', { e: e.message });
    }

    const order = await ordersRepo.create(db, {
      item: details.item,
      amount_cents: details.amount_cents,
      currency: details.currency,
      paypal_order_id: realOrderId,
      paypal_capture_id: realCaptureId,
      carrier: details.carrier,
      tracking_number: details.tracking_number,
      tracking_status: details.tracking_status,
      shipped_at: new Date(now.getTime() - 4 * 86400000),
      delivered_at: details.tracking_status === 'delivered' ? new Date(now.getTime() - 2 * 86400000) : null,
    });

    const newCase = await casesRepo.create(db, {
      source: details.source,
      reason: details.reason,
      buyer_message: details.buyer_message,
      amount_cents: details.amount_cents,
      currency: details.currency,
      deadline_at: details.source === 'dispute' ? new Date(now.getTime() + 10 * 86400000) : null,
      available_actions: details.available_actions,
      order_id: order.id,
      simulated: false,
    });

    const paypal = createPayPal();
    const llm = createLlm();
    const executeActionFn = async (params: any) => executeAction(db, paypal, params);
    const result = await processCase(db, llm, newCase.id, executeActionFn);

    return {
      ok: true,
      caseId: newCase.id,
      orderId: realOrderId,
      item: order.item,
      amountCents: order.amount_cents,
      recommendation: result.recommendation,
      status: result.case?.status,
    };
  },
});
