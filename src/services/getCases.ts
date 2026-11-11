import type { DbClient } from '@/db/client';
import type { CaseListItem, CaseDetail, DecisionType, CaseStatus } from '@/domain/types';
import { casesRepo } from '@/db/repos/cases';
import { ordersRepo } from '@/db/repos/orders';
import { recommendationsRepo } from '@/db/repos/recommendations';
import { eventsRepo } from '@/db/repos/events';
import { AppError } from '@/lib/errors';
import { clock } from '@/lib/clock';
import { isActionable } from '@/domain/states';

export async function listCases(db: DbClient, bucket?: string): Promise<CaseListItem[]> {
  const allCases = await casesRepo.list(db);
  const today = clock.todayIso();

  const items: CaseListItem[] = [];
  for (const c of allCases) {
    const rec = await recommendationsRepo.getLatestForCase(db, c.id);

    items.push({
      id: c.id,
      source: c.source,
      status: c.status,
      reason: c.reason,
      amountCents: c.amount_cents,
      currency: c.currency,
      deadlineAt: c.deadline_at ? c.deadline_at.toISOString() : null,
      snoozedUntil: c.snoozed_until,
      recommendation: rec
        ? {
            action: rec.action,
            amountCents: rec.refund_amount_cents ?? undefined,
            mode: rec.mode,
          }
        : null,
      simulated: c.simulated,
    });
  }

  // Sort per ARCHITECTURE §9.7:
  // 1. Actionable first
  // 2. waiting_on_paypal second
  // 3. snoozed (future) third
  // 4. resolved/closed last
  // Inside bucket 1: deadline_at ascending (nulls last), then amount_cents descending
  return items.sort((a, b) => {
    const aActionable = isActionable(a.status, a.snoozedUntil, today);
    const bActionable = isActionable(b.status, b.snoozedUntil, today);

    if (aActionable && !bActionable) return -1;
    if (!aActionable && bActionable) return 1;

    if (aActionable && bActionable) {
      if (a.deadlineAt && b.deadlineAt) {
        const diff = new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
        if (diff !== 0) return diff;
      } else if (a.deadlineAt && !b.deadlineAt) {
        return -1;
      } else if (!a.deadlineAt && b.deadlineAt) {
        return 1;
      }
      return b.amountCents - a.amountCents;
    }

    return 0;
  });
}

export async function getCaseDetail(db: DbClient, id: string): Promise<CaseDetail> {
  const c = await casesRepo.findById(db, id);
  if (!c) {
    throw new AppError('NOT_FOUND', `Case ${id} not found`);
  }

  const order = await ordersRepo.findById(db, c.order_id);
  if (!order) {
    throw new AppError('NOT_FOUND', `Order ${c.order_id} not found for case ${id}`);
  }

  const rec = await recommendationsRepo.getLatestForCase(db, c.id);
  const evts = await eventsRepo.listForCase(db, c.id);

  const availableDecisions: DecisionType[] = [];
  const disabledReasons: Record<string, string> = {};

  if (c.status === 'awaiting_approval' || c.status === 'exec_failed') {
    availableDecisions.push('approve', 'edit', 'snooze');
  } else {
    disabledReasons.approve = `Case is in '${c.status}' status, not awaiting approval`;
    disabledReasons.edit = `Case is in '${c.status}' status, not awaiting approval`;
    disabledReasons.snooze = `Case is in '${c.status}' status, not awaiting approval`;
  }

  return {
    id: c.id,
    source: c.source,
    status: c.status,
    reason: c.reason,
    amountCents: c.amount_cents,
    currency: c.currency,
    deadlineAt: c.deadline_at ? c.deadline_at.toISOString() : null,
    snoozedUntil: c.snoozed_until,
    simulated: c.simulated,
    buyerMessage: c.buyer_message,
    order: {
      id: order.id,
      item: order.item,
      amountCents: order.amount_cents,
      currency: order.currency,
      carrier: order.carrier,
      trackingNumber: order.tracking_number,
      trackingStatus: order.tracking_status,
      deliveredAt: order.delivered_at ? order.delivered_at.toISOString() : null,
    },
    recommendation: rec
      ? {
          id: rec.id,
          action: rec.action,
          refundAmountCents: rec.refund_amount_cents,
          policyClauseId: rec.policy_clause_id,
          rationale: rec.rationale,
          evidenceNarrative: rec.evidence_narrative,
          trackingMessageDraft: rec.tracking_message_draft,
          mode: rec.mode,
          gateReasons: rec.gate_reasons,
          origin: rec.origin,
        }
      : null,
    provenance: rec ? rec.provenance : null,
    events: evts.map((e) => ({
      id: e.id,
      type: e.type,
      actor: e.actor,
      payload: e.payload,
      at: e.at.toISOString(),
    })),
    availableDecisions,
    disabledReasons,
  };
}

