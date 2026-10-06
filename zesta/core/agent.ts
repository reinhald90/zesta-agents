import { ChatMessage } from '@/lib/ai/providers';
import { getProvider } from '@/lib/ai/gateway';
import { env } from '@/lib/env';
import { zestaConfig } from '@/config/zesta.config';
import { buildPersonalityPrompt } from '@/zesta/personality/personality';
import { communicationGuidelines } from '@/zesta/personality/communication';
import { plan } from './planner';

export type ActivityKind =
  | 'planning' | 'researching' | 'reading' | 'verifying'
  | 'reflecting' | 'memory_update' | 'responding' | 'completed';

export interface ActivityEvent { kind: ActivityKind; label: string }

export interface AgentStreamEvent {
  type: 'activity' | 'text' | 'done' | 'error';
  activity?: ActivityEvent;
  delta?: string;
  error?: string;
}

export interface AgentRunArgs {
  messages: ChatMessage[];
  signal?: AbortSignal;
}

export class ZestaAgent {
  readonly id = 'zesta';

  async *run({ messages, signal }: AgentRunArgs): AsyncIterable<AgentStreamEvent> {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    const p = plan(lastUser);

    yield { type: 'activity', activity: { kind: 'planning', label: activityLabelFor(p.intent) } };

    const system = [
      buildPersonalityPrompt(),
      '\nGuidelines:',
      ...communicationGuidelines.map(g => `- ${g}`),
      `\nTanggal: ${new Date().toISOString().slice(0, 10)}`,
    ].join('\n');

    const trimmed = messages.slice(-zestaConfig.maxHistoryMessages);
    const finalMessages: ChatMessage[] = [{ role: 'system', content: system }, ...trimmed];

    yield { type: 'activity', activity: { kind: 'responding', label: 'Menyusun jawaban' } };

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
      yield { type: 'error', error: 'Provider gagal memberi respons. Coba lagi.' };
      return;
    }

    yield { type: 'activity', activity: { kind: 'completed', label: 'Selesai' } };
    yield { type: 'done' };
  }
}

function activityLabelFor(intent: ReturnType<typeof plan>['intent']): string {
  switch (intent) {
    case 'learn':    return 'Merencanakan langkah pembelajaran';
    case 'research': return 'Merencanakan riset';
    case 'task':     return 'Merencanakan eksekusi task';
    default:         return 'Memahami permintaan';
  }
}

export const agentMeta = {
  provider: () => env.ZESTA_DEFAULT_PROVIDER,
};
