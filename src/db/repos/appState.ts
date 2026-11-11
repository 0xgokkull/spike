import { eq } from 'drizzle-orm';
import { app_state } from '../schema';
import type { DbClient } from '../client';

export const appStateRepo = {
  async get<T = unknown>(db: DbClient, key: string): Promise<T | null> {
    const [found] = await db.select().from(app_state).where(eq(app_state.key, key));
    return (found?.value as T) ?? null;
  },

  async set(db: DbClient, key: string, value: unknown) {
    const [upserted] = await db
      .insert(app_state)
      .values({ key, value })
      .onConflictDoUpdate({
        target: app_state.key,
        set: { value },
      })
      .returning();
    return upserted;
  },
};
