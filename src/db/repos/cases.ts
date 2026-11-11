import { eq, inArray, and } from 'drizzle-orm';
import { cases } from '../schema';
import { eventsRepo } from './events';
import { canTransition } from '@/domain/states';
import { AppError } from '@/lib/errors';
import type { CaseStatus, Actor, CaseSource, Reason, ActionType } from '@/domain/types';
import type { DbClient } from '../client';

export interface CreateCaseInput {
  id?: string;
  source: CaseSource;
  paypal_dispute_id?: string | null;
  order_id: string;
  reason: Reason;
  buyer_message: string;
  amount_cents: number;
  currency?: string;
  deadline_at?: Date | null;
  status?: CaseStatus;
  available_actions?: ActionType[];
  simulated?: boolean;
}

export const casesRepo = {
  async create(db: DbClient, input: CreateCaseInput) {
    const [created] = await db
      .insert(cases)
      .values({
        ...input,
        currency: input.currency ?? 'USD',
        status: input.status ?? 'new',
        available_actions: input.available_actions ?? [],
        simulated: input.simulated ?? false,
      })
      .returning();
    return created;
  },

  async findById(db: DbClient, id: string) {
    const [found] = await db.select().from(cases).where(eq(cases.id, id));
    return found ?? null;
  },

  async findByDisputeId(db: DbClient, disputeId: string) {
    const [found] = await db.select().from(cases).where(eq(cases.paypal_dispute_id, disputeId));
    return found ?? null;
  },

  async list(db: DbClient, filter?: { status?: CaseStatus; source?: CaseSource }) {
    const conditions = [];
    if (filter?.status) {
      conditions.push(eq(cases.status, filter.status));
    }
    if (filter?.source) {
      conditions.push(eq(cases.source, filter.source));
    }

    if (conditions.length > 0) {
      return db.select().from(cases).where(and(...conditions));
    }
    return db.select().from(cases);
  },

  async transition(
    db: DbClient,
    id: string,
    from: CaseStatus[],
    to: CaseStatus,
    actor: Actor,
    payload: Record<string, unknown> = {}
  ) {
    // Validate that from -> to transition is allowed per state machine
    for (const fromStatus of from) {
      if (!canTransition(fromStatus, to)) {
        throw new AppError(
          'CONFLICT_STATE',
          `Illegal state machine transition: cannot move from '${fromStatus}' to '${to}'`
        );
      }
    }

    const [updated] = await db
      .update(cases)
      .set({
        status: to,
        snoozed_until: (payload.snoozed_until as string) ?? null,
        outcome: (payload.outcome as any) ?? null,
        updated_at: new Date(),
      })
      .where(and(eq(cases.id, id), inArray(cases.status, from)))
      .returning();

    if (!updated) {
      throw new AppError(
        'CONFLICT_STATE',
        `Case ${id} could not transition to '${to}'. Current status is not in [${from.join(', ')}]`
      );
    }

    await eventsRepo.append(db, id, 'case.transitioned', actor, {
      from,
      to,
      ...payload,
    });

    return updated;
  },
};

