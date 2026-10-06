import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  ZESTA_DEFAULT_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'mock']).default('mock'),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-latest'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // jangan tampilkan value, hanya field
  console.error('[env] invalid:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}
export const env = parsed.data;
