import { eq, desc } from 'drizzle-orm';
import { policies } from '../schema';
import type { DbClient } from '../client';
import type { PolicyRules } from '@/domain/types';

export const policiesRepo = {
  async getActive(db: DbClient) {
    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.active, true))
      .orderBy(desc(policies.version))
      .limit(1);
    return policy ?? null;
  },

  async create(db: DbClient, input: { text: string; rules: PolicyRules; version?: number; active?: boolean }) {
    const [created] = await db
      .insert(policies)
      .values({
        ...input,
        version: input.version ?? 1,
        active: input.active ?? true,
      })
      .returning();
    return created;
  },
};
