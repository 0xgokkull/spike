import { eq, and, isNull } from 'drizzle-orm';
import { actions } from '../schema';
import type { DbClient } from '../client';
import type { ActionType } from '@/domain/types';

export interface CreateActionInput {
  case_id: string;
  recommendation_id?: string | null;
  type: ActionType;
  input: Record<string, unknown>;
  idempotency_key: string;
  actor: 'agent_auto' | 'seller';
  simulated?: boolean;
}

export const actionsRepo = {
  async create(db: DbClient, input: CreateActionInput) {
    const [created] = await db
      .insert(actions)
      .values({
        ...input,
        status: 'pending',
        simulated: input.simulated ?? false,
      })
      .returning();
    return created;
  },

  async findByIdempotencyKey(db: DbClient, key: string) {
    const [found] = await db.select().from(actions).where(eq(actions.idempotency_key, key));
    return found ?? null;
  },

  async update(
    db: DbClient,
    id: string,
    data: {
      status?: 'pending' | 'succeeded' | 'failed';
      request?: Record<string, unknown>;
      response?: Record<string, unknown>;
      error?: Record<string, unknown>;
      paypal_refs?: Record<string, string>;
      acknowledged_at?: Date | null;
    }
  ) {
    const [updated] = await db.update(actions).set(data).where(eq(actions.id, id)).returning();
    return updated ?? null;
  },

  async listByCase(db: DbClient, caseId: string) {
    return db.select().from(actions).where(eq(actions.case_id, caseId));
  },

  async listUnacknowledgedAuto(db: DbClient) {
    return db
      .select()
      .from(actions)
      .where(and(eq(actions.actor, 'agent_auto'), isNull(actions.acknowledged_at)));
  },
};

