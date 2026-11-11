import { eq, desc } from 'drizzle-orm';
import { recommendations } from '../schema';
import type { DbClient } from '../client';
import type { ActionType, ExecutionMode, Provenance } from '@/domain/types';

export interface CreateRecommendationInput {
  case_id: string;
  action: ActionType;
  refund_amount_cents?: number | null;
  policy_clause_id: string;
  rationale: string;
  evidence_narrative?: string | null;
  tracking_message_draft?: string | null;
  provenance: Provenance;
  mode: ExecutionMode;
  gate_reasons?: string[];
  origin: 'llm' | 'fallback';
  validation?: Record<string, unknown>;
}

export const recommendationsRepo = {
  async create(db: DbClient, input: CreateRecommendationInput) {
    const [created] = await db
      .insert(recommendations)
      .values({
        ...input,
        gate_reasons: input.gate_reasons ?? [],
        validation: input.validation ?? {},
      })
      .returning();
    return created;
  },

  async getLatestForCase(db: DbClient, caseId: string) {
    const [found] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.case_id, caseId))
      .orderBy(desc(recommendations.created_at))
      .limit(1);
    return found ?? null;
  },
};

