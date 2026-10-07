import { ChatMessage } from '@/lib/ai/providers';
import { getProvider } from '@/lib/ai/gateway';
import { env } from '@/lib/env';
import { zestaConfig } from '@/config/zesta.config';
import { buildPersonalityPrompt } from '@/zesta/personality/personality';
import { communicationGuidelines } from '@/zesta/personality/communication';
import { plan } from './planner';
import { research } from '@/zesta/web/researcher';

export type ActivityKind =
  | 'planning'
  | 'researching'
  | 'reading'
  | 'verifying'
  | 'reflecting'
  | 'memory_update'
  | 'responding'
  | 'completed';

export interface ActivityEvent {
  kind: ActivityKind;
  label: string;
}

export interface AgentStreamEvent {
  type: 'activity' | 'text' | 'done' | 'error' | 'conversation';
  activity?: ActivityEvent;
  delta?: string;
  error?: string;
  id?: string;
  title?: string;
}

export interface AgentRunArgs {
  messages: ChatMessage[];
  signal?: AbortSignal;
}

export class ZestaAgent {
  readonly id = 'zesta';

  async *run({
    messages,
    signal,
  }: AgentRunArgs): AsyncIterable<AgentStreamEvent> {
    const lastUser =
      [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const p = plan(lastUser);

    yield {
      type: 'activity',
      activity: { kind: 'planning', label: activityLabelFor(p.intent) },
    };

    /* ── Phase 3: Web research (kalau intent = research) ─────── */
    let researchContext = '';
    if (p.intent === 'research' && !signal?.aborted) {
      try {
        for await (const evt of research(lastUser, { maxSources: 3, signal })) {
          if (evt.type === 'activity') {
            yield {
              type: 'activity',
              activity: { kind: evt.kind, label: evt.label },
            };
          } else if (evt.type === 'context') {
            researchContext = evt.context;
          } else if (evt.type === 'error') {
            yield {
              type: 'activity',
              activity: { kind: 'researching', label: evt.error },
            };
          }
        }
      } catch (err) {
        console.warn('[agent] research gagal:', err);
      }
    }

    /* ── Susun prompt ──────────────────────────────────────── */
    const system = [
      buildPersonalityPrompt(),
      '\nGuidelines:',
      ...communicationGuidelines.map((g) => `- ${g}`),
      `\nTanggal: ${new Date().toISOString().slice(0, 10)}`,
    ].join('\n');

    const trimmed = messages.slice(-zestaConfig.maxHistoryMessages);

    const finalMessages: ChatMessage[] = [{ role: 'system', content: system }];

    if (researchContext) {
      finalMessages.push({
        role: 'system',
        content:
          'Kamu baru saja melakukan riset web. Gunakan konteks berikut ' +
          'untuk menjawab user. Jangan mengarang fakta di luar konteks ini.\n\n' +
          researchContext,
      });
    }

    finalMessages.push(...trimmed);

    yield {
      type: 'activity',
      activity: { kind: 'responding', label: 'Menyusun jawaban' },
    };

    /* ── Stream dari provider ──────────────────────────────── */
    const provider = getProvider();
    try {
      for await (const delta of provider.chat(finalMessages, {
        signal,
        temperature: zestaConfig.defaultTemperature,
        model: undefined,
      })) {
        yield { type: 'text', delta };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      console.error('[agent] provider error:', msg);

      if (researchContext) {
        // Fallback: provider gagal, tapi riset berhasil → tunjukkan hasil mentah
        yield {
          type: 'text',
          delta:
            '\n\n⚠️ LLM tidak tersedia. Ini hasil riset mentah:\n\n' +
            researchContext.slice(0, 2500),
        };
      } else {
        yield {
          type: 'error',
          error: 'Provider gagal memberi respons. Coba lagi.',
        };
        return;
      }
    }

    yield {
      type: 'activity',
      activity: { kind: 'completed', label: 'Selesai' },
    };
    yield { type: 'done' };
  }
}

function activityLabelFor(intent: ReturnType<typeof plan>['intent']): string {
  switch (intent) {
    case 'learn':
      return 'Merencanakan langkah pembelajaran';
    case 'research':
      return 'Merencanakan riset';
    case 'task':
      return 'Merencanakan eksekusi task';
    default:
      return 'Memahami permintaan';
  }
}

export const agentMeta = {
  provider: () => env.ZESTA_DEFAULT_PROVIDER,
};
