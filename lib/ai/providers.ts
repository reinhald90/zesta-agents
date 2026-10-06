import { env } from '@/lib/env';

export type Role = 'system' | 'user' | 'assistant';
export interface ChatMessage { role: Role; content: string }

export interface ChatOptions {
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
  maxTokens?: number;
}

export interface AIProvider {
  readonly id: string;
  chat(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<string>;
}

/* ─────────── OpenAI-compatible ─────────── */
export class OpenAICompatibleProvider implements AIProvider {
  readonly id = 'openai';
  constructor(
    private apiKey: string,
    private baseUrl: string = 'https://api.openai.com/v1',
    private defaultModel = 'gpt-4o-mini',
  ) {}

  async *chat(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: opts.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`provider ${this.id} failed: ${res.status} ${await res.text().catch(() => '')}`);
    }
    yield* parseSSE(res.body, (json) => json?.choices?.[0]?.delta?.content as string | undefined);
  }
}

/* ─────────── Anthropic ─────────── */
export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic';
  constructor(private apiKey: string, private defaultModel = 'claude-3-5-sonnet-latest') {}

  async *chat(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<string> {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const rest = messages.filter(m => m.role !== 'system');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: opts.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        system: system || undefined,
        messages: rest,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 4096,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`provider ${this.id} failed: ${res.status} ${await res.text().catch(() => '')}`);
    }
    yield* parseSSE(res.body, (json) => {
      if (json?.type === 'content_block_delta') return json?.delta?.text as string | undefined;
      return undefined;
    });
  }
}

/* ─────────── Google Gemini ─────────── */
export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  constructor(private apiKey: string, private defaultModel = 'gemini-2.0-flash') {}

  async *chat(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<string> {
    const model = opts.model ?? this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const res = await fetch(url, {
      method: 'POST',
      signal: opts.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature: opts.temperature ?? 0.7, maxOutputTokens: opts.maxTokens },
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`provider ${this.id} failed: ${res.status} ${await res.text().catch(() => '')}`);
    }
    yield* parseSSE(res.body, (json) => json?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined);
  }
}

/* ─────────── Mock (dev fallback) ─────────── */
export class MockProvider implements AIProvider {
  readonly id = 'mock';
  async *chat(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<string> {
    const last = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    const reply =
      `_MockProvider aktif._ Set \`ZESTA_DEFAULT_PROVIDER\` dan API key untuk respons nyata.\n\n` +
      `**Kamu menulis:**\n\n> ${last.replace(/\n/g, '\n> ')}\n\n` +
      `Ini contoh blok kode:\n\n\`\`\`ts\nconst greet = (name: string) => \`Halo, \${name}!\`;\nconsole.log(greet('Zesta'));\n\`\`\`\n`;
    for (const chunk of chunkString(reply, 6)) {
      if (opts.signal?.aborted) return;
      await new Promise(r => setTimeout(r, 25));
      yield chunk;
    }
  }
}

/* ─────────── Helpers ─────────── */
async function* parseSSE(
  body: ReadableStream<Uint8Array>,
  extract: (json: any) => string | undefined,
): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload);
          const text = extract(json);
          if (text) yield text;
        } catch { /* ignore partial */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function* chunkString(s: string, size: number): Iterable<string> {
  for (let i = 0; i < s.length; i += size) yield s.slice(i, i + size);
}
