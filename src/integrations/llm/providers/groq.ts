import Groq from 'groq-sdk';
import type { LlmPort } from '../port';
import { env } from '@/lib/env';
import { AppError } from '@/lib/errors';

export class GroqLlm implements LlmPort {
  private client: Groq;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || env.GROQ_API_KEY || env.LLM_API_KEY;
    if (!key) {
      throw new AppError('LLM_ERROR', 'Missing GROQ_API_KEY for Groq provider');
    }
    this.client = new Groq({ apiKey: key });
    this.model = model || env.LLM_MODEL || 'qwen/qwen3.8-27b';
  }

  async generate(options: {
    system: string;
    input: string;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.input },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: options.maxTokens ?? 1024,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Groq returned empty response');
      }
      return content;
    } catch (err: any) {
      throw new AppError('LLM_ERROR', `Groq API error: ${err.message}`);
    }
  }
}

