import { env } from '@/lib/env';
import type { LlmPort } from './port';
import { GroqLlm } from './providers/groq';
import { MockLlm } from './providers/mock';

export * from './port';
export * from './structured';
export { MockLlm } from './providers/mock';
export { GroqLlm } from './providers/groq';

export function createLlm(): LlmPort {
  if (env.LLM_PROVIDER === 'groq' && (env.GROQ_API_KEY || env.LLM_API_KEY)) {
    return new GroqLlm();
  }
  return new MockLlm();
}

