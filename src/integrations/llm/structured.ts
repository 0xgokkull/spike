import { z } from 'zod';
import type { LlmPort } from './port';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export interface GenerateStructuredOptions<T> {
  schema: z.ZodType<T>;
  system: string;
  input: string;
  maxTokens?: number;
}

export async function generateStructured<T>(
  llm: LlmPort,
  options: GenerateStructuredOptions<T>
): Promise<T> {
  const { schema, system, input, maxTokens } = options;

  let raw: string;
  try {
    raw = await llm.generate({ system, input, maxTokens });
  } catch (err: any) {
    logger.error('LLM generation call failed', { error: err.message });
    throw new AppError('LLM_ERROR', `LLM call failed: ${err.message}`);
  }

  // Attempt 1 parse
  let parsedJson: unknown;
  try {
    // Strip possible markdown fences like ```json ... ```
    const cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
    parsedJson = JSON.parse(cleaned);
  } catch (parseErr) {
    logger.warn('Failed to parse initial LLM JSON output, retrying once...', { raw });
  }

  if (parsedJson) {
    const validated = schema.safeParse(parsedJson);
    if (validated.success) {
      return validated.data;
    }
    logger.warn('LLM output schema validation failed, retrying once with error feedback...', {
      errors: validated.error.format(),
    });
  }

  // Retry once with error feedback appended
  const retryInput = `${input}\n\nIMPORTANT: Your previous response was invalid. Please return strictly valid JSON matching the schema.\nPrevious response: ${raw}`;
  try {
    const retryRaw = await llm.generate({ system, input: retryInput, maxTokens });
    const cleanedRetry = retryRaw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
    const retryJson = JSON.parse(cleanedRetry);
    const retryValidated = schema.safeParse(retryJson);
    if (retryValidated.success) {
      return retryValidated.data;
    }
    throw new AppError('LLM_ERROR', 'LLM output schema validation failed on retry', retryValidated.error.format());
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('LLM_ERROR', `Failed to obtain valid structured output from LLM: ${err.message}`);
  }
}
