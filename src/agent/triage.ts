import { z } from 'zod';
import type { LlmPort } from '@/integrations/llm/port';
import { generateStructured } from '@/integrations/llm/structured';
import { TRIAGE_SYSTEM_PROMPT } from './prompts/triage';
import { ReasonSchema, type TriageResult } from '@/domain/types';

const TriageResultSchema = z.object({
  reason: ReasonSchema,
  buyerClaim: z.string().max(300),
  requestedOutcome: z.enum(['refund', 'replacement', 'info', 'unknown']),
});

export async function triageCase(llm: LlmPort, buyerMessage: string): Promise<TriageResult> {
  const userInput = `Buyer message to analyze:\n"""\n${buyerMessage.slice(0, 1000)}\n"""`;

  return generateStructured<TriageResult>(llm, {
    schema: TriageResultSchema,
    system: TRIAGE_SYSTEM_PROMPT,
    input: userInput,
  });
}

