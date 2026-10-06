import { NextRequest } from 'next/server';
import { z } from 'zod';
import { runChat } from '@/zesta/core/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1).max(20_000),
    })
  ).min(1).max(100),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid body', detail: (err as Error).message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const encoder = new TextEncoder();
  const abort = new AbortController();
  req.signal.addEventListener('abort', () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        for await (const evt of runChat({ messages: parsed.messages, signal: abort.signal })) {
          send(evt);
          if (evt.type === 'done' || evt.type === 'error') break;
        }
      } catch (err) {
        console.error('[api/chat] stream error:', err);
        send({ type: 'error', error: 'Internal error' });
      } finally {
        controller.close();
      }
    },
    cancel() { abort.abort(); },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
