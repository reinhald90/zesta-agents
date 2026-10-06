import { env } from '@/lib/env';
import {
  AnthropicProvider, AIProvider, GeminiProvider, MockProvider, OpenAICompatibleProvider,
} from './providers';

let cached: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (cached) return cached;
  const choice = env.ZESTA_DEFAULT_PROVIDER;

  if (choice === 'openai' && env.OPENAI_API_KEY) {
    cached = new OpenAICompatibleProvider(env.OPENAI_API_KEY, env.OPENAI_BASE_URL, env.OPENAI_MODEL);
  } else if (choice === 'anthropic' && env.ANTHROPIC_API_KEY) {
    cached = new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
  } else if (choice === 'gemini' && env.GEMINI_API_KEY) {
    cached = new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
  } else {
    if (choice !== 'mock') {
      console.warn(`[gateway] provider "${choice}" tidak siap (API key kosong), fallback ke mock.`);
    }
    cached = new MockProvider();
  }
  return cached;
}
