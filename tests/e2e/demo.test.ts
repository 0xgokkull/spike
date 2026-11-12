import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createTestDb } from '../helpers/db';
import type { DbClient } from '@/db/client';
import { FakePayPal } from '@/integrations/paypal/fake';
import { MockLlm } from '@/integrations/llm/providers/mock';
import { policiesRepo } from '@/db/repos/policies';
import { ordersRepo } from '@/db/repos/orders';
import { casesRepo } from '@/db/repos/cases';
import { actionsRepo } from '@/db/repos/actions';
import { syncCases } from '@/services/syncCases';
import { processCase } from '@/services/processCase';
import { executeAction } from '@/services/executeAction';
import { decideCase } from '@/services/decideCase';
import { getDayCloseStatus, closeDay } from '@/services/closeDay';
import { wakeSnoozed } from '@/services/wakeSnoozed';
import { clock } from '@/lib/clock';

describe('End-to-End Demo Flow (Step 7)', () => {
  beforeEach(() => {
    clock.setOffsetDays(0);
  });

  it('executes full 3-minute demo lifecycle: sync -> auto-refund -> contest approval -> snooze -> day close', async () => {
    const testDbRes = await createTestDb();
    const db = testDbRes.db as unknown as DbClient;
    const paypal = new FakePayPal();
    const llm = new MockLlm();

    // 1. Merchant Policy
    await policiesRepo.create(db, {
      text: 'Standard Store Return and Dispute Policy',
      rules: {
        version: 1,
        clauses: [
          { id: 'P-INR-1', text: 'If item is not received and tracking is in transit, refund under $50.' },
          { id: 'P-INR-2', text: 'If item was delivered with tracking proof, contest dispute.' },
        ],
        autoRefundCapCents: 5000,
        autoRefundReasons: ['MERCHANDISE_OR_SERVICE_NOT_RECEIVED'],
        refundWindowDays: 30,
      },
    });

    // 2. Orders in DB
    const orderDeliveredId = randomUUID();
    const orderInTransitId = randomUUID();

    const orderDelivered = await ordersRepo.create(db, {
      id: orderDeliveredId,
      item: 'Vintage Leather Jacket',
      amount_cents: 4500,
      refunded_cents: 0,
      currency: 'USD',
      paypal_capture_id: orderDeliveredId,
      carrier: 'USPS',
      tracking_number: '9400111899223100000001',
      tracking_status: 'delivered',
      delivered_at: new Date('2026-11-05T12:00:00Z'),
    });

    const orderInTransit = await ordersRepo.create(db, {
      id: orderInTransitId,
      item: 'Wireless Headphones',
      amount_cents: 3000,
      refunded_cents: 0,
      currency: 'USD',
      paypal_capture_id: orderInTransitId,
      carrier: 'UPS',
      tracking_number: '1Z9999999999999992',
      tracking_status: 'in_transit',
      delivered_at: null,
    });

    // 3. Fake PayPal disputes matching the orders
    paypal.clearDisputes();
    paypal.addDispute({
      dispute_id: 'PP-D-DELIVERED',
      status: 'WAITING_FOR_SELLER_RESPONSE',
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      dispute_amount: { value: '45.00', currency_code: 'USD' },
      dispute_life_cycle_stage: 'CHARGEBACK',
      seller_response_due_date: '2026-11-20T00:00:00.000Z',
      disputed_transactions: [{ seller_transaction_id: orderDelivered.id }],
      messages: [{ posted_by: 'BUYER', content: 'Package did not arrive', time_posted: '2026-11-10T10:00:00Z' }],
      links: [
        { href: 'https://api.sandbox.paypal.com/v1/customer/disputes/PP-D-DELIVERED/provide-evidence', rel: 'provide-evidence', method: 'POST' },
      ],
    });

    paypal.addDispute({
      dispute_id: 'PP-D-IN_TRANSIT',
      status: 'WAITING_FOR_SELLER_RESPONSE',
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      dispute_amount: { value: '30.00', currency_code: 'USD' },
      dispute_life_cycle_stage: 'INQUIRY',
      seller_response_due_date: '2026-11-20T00:00:00.000Z',
      disputed_transactions: [{ seller_transaction_id: orderInTransit.id }],
      messages: [{ posted_by: 'BUYER', content: 'Lost in mail, please refund', time_posted: '2026-11-10T11:00:00Z' }],
      links: [
        { href: 'https://api.sandbox.paypal.com/v1/customer/disputes/PP-D-IN_TRANSIT/provide-evidence', rel: 'provide-evidence', method: 'POST' },
      ],
    });

    // 4. Sync disputes from PayPal into Resolution Desk
    const syncResult = await syncCases(db, paypal);
    expect(syncResult.created).toBe(2);

    const allCases = await casesRepo.list(db);
    expect(allCases.length).toBe(2);

    const caseDelivered = allCases.find((c) => c.paypal_dispute_id === 'PP-D-DELIVERED')!;
    const caseInTransit = allCases.find((c) => c.paypal_dispute_id === 'PP-D-IN_TRANSIT')!;

    const executeActionFn = (params: any) => executeAction(db, paypal, params);

    // 5. Agent processes Case 2 (In Transit, $30 <= $50 cap) -> Auto-refund
    llm.setNextResponse(
      JSON.stringify({
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        buyerClaim: 'Lost in mail',
        requestedOutcome: 'refund',
      })
    );
    llm.setNextResponse(
      JSON.stringify({
        action: 'refund',
        refundAmountCents: 3000,
        policyClauseId: 'P-INR-1',
        rationale: 'Item lost in transit, refund per policy.',
      })
    );

    const autoResult = await processCase(db, llm, caseInTransit.id, executeActionFn);
    expect(autoResult.recommendation.mode).toBe('auto');

    const updatedCaseInTransit = await casesRepo.findById(db, caseInTransit.id);
    expect(updatedCaseInTransit?.status).toBe('resolved');

    const autoActions = await actionsRepo.listByCase(db, caseInTransit.id);
    expect(autoActions.length).toBe(1);
    expect(autoActions[0].actor).toBe('agent_auto');
    expect(autoActions[0].acknowledged_at).toBeNull();

    // 6. Agent processes Case 1 (Delivered tracking, $45) -> Proposes contest (Approval required)
    llm.setNextResponse(
      JSON.stringify({
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        buyerClaim: 'Did not arrive',
        requestedOutcome: 'refund',
      })
    );
    llm.setNextResponse(
      JSON.stringify({
        action: 'contest',
        policyClauseId: 'P-INR-2',
        rationale: 'Item was verified delivered by USPS.',
      })
    );

    const approvalResult = await processCase(db, llm, caseDelivered.id, executeActionFn);
    expect(approvalResult.recommendation.mode).toBe('approval');

    const updatedCaseDelivered = await casesRepo.findById(db, caseDelivered.id);
    expect(updatedCaseDelivered?.status).toBe('awaiting_approval');

    // 7. Seller decides to approve the contest recommendation
    await decideCase(db, paypal, {
      caseId: caseDelivered.id,
      decision: 'approve',
    });

    const contestedCase = await casesRepo.findById(db, caseDelivered.id);
    expect(contestedCase?.status).toBe('waiting_on_paypal');

    // 8. Test Snooze flow on a new case
    const orderSnoozeId = randomUUID();
    const orderSnooze = await ordersRepo.create(db, {
      id: orderSnoozeId,
      item: 'Mechanical Keyboard',
      amount_cents: 2500,
      refunded_cents: 0,
      currency: 'USD',
      paypal_capture_id: orderSnoozeId,
      carrier: 'FedEx',
      tracking_number: '794611111111',
      tracking_status: 'in_transit',
      delivered_at: null,
    });

    const caseSnooze = await casesRepo.create(db, {
      order_id: orderSnooze.id,
      source: 'refund_request',
      status: 'awaiting_approval',
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      buyer_message: 'Please refund, I would like to cancel.',
      amount_cents: 2500,
      currency: 'USD',
      available_actions: ['refund', 'reply'],
      simulated: true,
    });

    const tomorrow = clock.now();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];

    await decideCase(db, paypal, {
      caseId: caseSnooze.id,
      decision: 'snooze',
      until: tomorrowIso,
    });

    const snoozed = await casesRepo.findById(db, caseSnooze.id);
    expect(snoozed?.status).toBe('snoozed');
    expect(snoozed?.snoozed_until).toBe(tomorrowIso);

    // Advance simulated clock by 1 day and wake snoozed cases
    clock.setOffsetDays(1);
    const woken = await wakeSnoozed(db);
    expect(woken.woken).toBe(1);

    const wokenCase = await casesRepo.findById(db, caseSnooze.id);
    expect(wokenCase?.status).toBe('action_ready');

    // 9. Day Close Checkpoint
    // Execute refund on the woken case to resolve it cleanly
    await executeAction(db, paypal, {
      caseId: caseSnooze.id,
      type: 'refund',
      actor: 'seller',
      input: {
        amountCents: 2500,
      },
    });

    const dayCloseStatus = await getDayCloseStatus(db);
    expect(dayCloseStatus.blockers.length).toBe(0); // waiting_on_paypal is non-blocking
    expect(dayCloseStatus.unacknowledged.length).toBe(1);
    expect(dayCloseStatus.canClose).toBe(false); // Unacknowledged auto-action blocks close

    // Acknowledge the auto-refund action and close the day
    const ackId = dayCloseStatus.unacknowledged[0].id;
    await closeDay(db, [ackId]);

    // Verify day is closed and resolved cases transition to closed
    const finalInTransit = await casesRepo.findById(db, caseInTransit.id);
    expect(finalInTransit?.status).toBe('closed');
  });
});
