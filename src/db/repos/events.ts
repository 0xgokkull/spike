import { eq, desc } from 'drizzle-orm';
import { events } from '../schema';
import type { Actor } from '@/domain/types';
import type { DbClient } from '../client';

export const eventsRepo = {
  async append(
    db: DbClient,
    caseId: string | null,
    type: string,
    actor: Actor,
    payload: unknown = {}
  ) {
    const [created] = await db
      .insert(events)
      .values({
        case_id: caseId,
        type,
        actor,
        payload: payload as Record<string, unknown>,
      })
      .returning();
    return created;
  },

  async listForCase(db: DbClient, caseId: string) {
    return db
      .select()
      .from(events)
      .where(eq(events.case_id, caseId))
      .orderBy(desc(events.at), desc(events.id));
  },
};
