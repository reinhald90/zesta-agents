import { ChatMessage } from '@/lib/ai/providers';
import { ZestaAgent, type AgentStreamEvent } from './agent';
import { checkInput } from '@/zesta/safety/risk-check';
import { isAllowed } from '@/zesta/safety/permissions';
import { isStopped } from '@/zesta/safety/emergency-stop';

export interface RunInput {
  messages: ChatMessage[];
  signal?: AbortSignal;
}

export async function* runChat(input: RunInput): AsyncIterable<AgentStreamEvent> {
  if (isStopped()) {
    yield { type: 'error', error: 'Zesta sedang dihentikan sementara (emergency stop).' };
    return;
  }
  if (!isAllowed('chat')) {
    yield { type: 'error', error: 'Permission "chat" dimatikan.' };
    return;
  }

  const last = [...input.messages].reverse().find(m => m.role === 'user')?.content ?? '';
  const risk = checkInput(last);
  if (risk.blocked) {
    yield { type: 'error', error: risk.reason ?? 'Permintaan diblokir oleh safety layer.' };
    return;
  }

  const agent = new ZestaAgent();
  yield* agent.run({ messages: input.messages, signal: input.signal });
}
