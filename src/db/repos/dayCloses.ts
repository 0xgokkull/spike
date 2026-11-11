import { eq } from 'drizzle-orm';
import { day_closes } from '../schema';
import type { DbClient } from '../client';

export const dayClosesRepo = {
  async create(db: DbClient, day: string, summary: Record<string, unknown>) {
    const [created] = await db
      .insert(day_closes)
      .values({
        day,
        summary,
      })
      .returning();
    return created;
  },

  async getByDay(db: DbClient, day: string) {
    const [found] = await db.select().from(day_closes).where(eq(day_closes.day, day));
    return found ?? null;
  },
};

