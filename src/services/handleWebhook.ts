import type { DbClient } from '@/db/client';
import type { PayPalPort } from '@/integrations/paypal/port';
import { webhook_deliveries, cases, orders } from '@/db/schema';
import { casesRepo } from '@/db/repos/cases';
import { eventsRepo } from '@/db/repos/events';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

export interface HandleWebhookInput {
  headers: Record<string, string>;
  rawBody: string;
}

export async function handleWebhook(
  db: DbClient,
  paypal: PayPalPort,
  input: HandleWebhookInput
) {
  let event: any;
  try {
    event = JSON.parse(input.rawBody);
  } catch {
    throw new AppError('VALIDATION', 'Invalid JSON webhook payload');
  }

  const eventId = event.id;
  const eventType = event.event_type;

  if (!eventId || !eventType) {
    throw new AppError('VALIDATION', 'Missing id or event_type in webhook');
  }

  // 1. Verify webhook signature
  const verified = await paypal.verifyWebhook({
    headers: input.headers,
    rawBody: input.rawBody,
  });

  if (!verified) {
    logger.warn('Unverified webhook received', { eventId, eventType });
    await db.insert(webhook_deliveries).values({
      event_id: eventId,
      event_type: eventType,
      verified: false,
      payload: event,
    });
    throw new AppError('VALIDATION', 'Webhook signature verification failed');
  }

  // 2. Deduplicate
  const [existing] = await db
    .select()
    .from(webhook_deliveries)
    .where(eq(webhook_deliveries.event_id, eventId));

  if (existing) {
    logger.info('Duplicate webhook ignored', { eventId, eventType });
    return { ok: true, duplicate: true };
  }

  // Store delivery
  await db.insert(webhook_deliveries).values({
    event_id: eventId,
    event_type: eventType,
    verified: true,
    payload: event,
  });

  // 3. Process according to event type
  const resource = event.resource || {};
  const disputeId = resource.dispute_id || resource.id;

  if (eventType.startsWith('CUSTOMER.DISPUTE')) {
    if (disputeId) {
      const detail = await paypal.getDispute(disputeId);
      const existingCase = await casesRepo.findByDisputeId(db, disputeId);

      if (existingCase) {
        if (eventType === 'CUSTOMER.DISPUTE.RESOLVED' || detail.status === 'RESOLVED') {
          if (existingCase.status === 'waiting_on_paypal' || existingCase.status === 'awaiting_approval') {
            await casesRepo.transition(db, existingCase.id, [existingCase.status], 'resolved', 'paypal', {
              disputeOutcome: detail.links,
            });
            await eventsRepo.append(db, existingCase.id, 'paypal.dispute_resolved', 'paypal', {
              disputeId,
              status: detail.status,
            });
          }
        } else {
          // Updated dispute
          await db
            .update(cases)
            .set({
              available_actions: detail.availableActions,
              deadline_at: detail.sellerResponseDueDate ? new Date(detail.sellerResponseDueDate) : null,
              updated_at: new Date(),
            })
            .where(eq(cases.id, existingCase.id));

          await eventsRepo.append(db, existingCase.id, 'paypal.dispute_updated', 'paypal', {
            disputeId,
            status: detail.status,
          });
        }
      }
    }
  } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
    const captureId = resource.id;
    const amount = resource.amount?.value;
    if (captureId && amount) {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.paypal_capture_id, captureId));
      if (order) {
        await db
          .update(orders)
          .set({
            refunded_cents: order.refunded_cents + Math.round(parseFloat(amount) * 100),
          })
          .where(eq(orders.id, order.id));
      }
    }
  }

  // Mark processed
  await db
    .update(webhook_deliveries)
    .set({ processed_at: new Date() })
    .where(eq(webhook_deliveries.event_id, eventId));

  return { ok: true, duplicate: false };
}

