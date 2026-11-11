import type { DbClient } from '@/db/client';
import type { PayPalPort } from '@/integrations/paypal/port';
import { casesRepo } from '@/db/repos/cases';
import { ordersRepo } from '@/db/repos/orders';
import { eventsRepo } from '@/db/repos/events';
import { logger } from '@/lib/logger';
import { eq } from 'drizzle-orm';
import { cases, orders } from '@/db/schema';

export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
}

export async function syncCases(db: DbClient, paypal: PayPalPort): Promise<SyncResult> {
  logger.info('Starting dispute sync from PayPal...');
  const disputes = await paypal.listDisputes();

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of disputes) {
    const detail = await paypal.getDispute(item.disputeId);
    const existing = await casesRepo.findByDisputeId(db, detail.disputeId);

    if (!existing) {
      // Find matching order by capture ID or transaction ID
      let order = null;
      if (detail.sellerTransactionId) {
        const [found] = await db
          .select()
          .from(orders)
          .where(eq(orders.paypal_capture_id, detail.sellerTransactionId));
        order = found ?? null;
      }

      // If no matching order exists, create one from dispute details
      if (!order) {
        order = await ordersRepo.create(db, {
          item: `Disputed Item (${detail.reason})`,
          amount_cents: detail.disputeAmountCents,
          currency: detail.currency,
          paypal_capture_id: detail.sellerTransactionId,
          paypal_transaction_id: detail.sellerTransactionId,
          tracking_status: 'none',
        });
      }

      const deadline = detail.sellerResponseDueDate ? new Date(detail.sellerResponseDueDate) : null;

      const created = await casesRepo.create(db, {
        source: 'dispute',
        paypal_dispute_id: detail.disputeId,
        order_id: order.id,
        reason: detail.reason,
        buyer_message: detail.buyerMessage,
        amount_cents: detail.disputeAmountCents,
        currency: detail.currency,
        deadline_at: deadline,
        status: 'new',
        available_actions: detail.availableActions,
        simulated: detail.simulated,
      });

      await eventsRepo.append(db, created.id, 'case.created', 'paypal', {
        disputeId: detail.disputeId,
        reason: detail.reason,
        amountCents: detail.disputeAmountCents,
      });

      createdCount++;
    } else {
      // Update existing case available actions and deadline
      const deadline = detail.sellerResponseDueDate ? new Date(detail.sellerResponseDueDate) : null;
      await db
        .update(cases)
        .set({
          available_actions: detail.availableActions,
          deadline_at: deadline,
          updated_at: new Date(),
        })
        .where(eq(cases.id, existing.id));

      updatedCount++;
    }
  }

  logger.info('Dispute sync completed', {
    total: disputes.length,
    created: createdCount,
    updated: updatedCount,
  });

  return {
    synced: disputes.length,
    created: createdCount,
    updated: updatedCount,
  };
}
