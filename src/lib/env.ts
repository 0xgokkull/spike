import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/resolution_desk'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(''),
  PAYPAL_MODE: z.enum(['sandbox', 'fake']).default('fake'),
  PAYPAL_CLIENT_ID: z.string().optional().default(''),
  PAYPAL_CLIENT_SECRET: z.string().optional().default(''),
  PAYPAL_WEBHOOK_ID: z.string().optional().default(''),
  LLM_PROVIDER: z.enum(['groq', 'anthropic', 'mock']).default('mock'),
  GROQ_API_KEY: z.string().optional().default(''),
  LLM_API_KEY: z.string().optional().default(''),
  LLM_MODEL: z.string().default('llama-3.3-70b-versatile'),
  APP_BASE_URL: z.string().default('http://localhost:3000'),
  DEMO_MODE: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).default(true),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:', parsed.error.format());
    throw new Error('Environment configuration error');
  }
  return parsed.data;
}

export const env: Env = loadEnv();

