import { NextRequest } from 'next/server';
import { z } from 'zod';
import { runChat } from '@/zesta/core/orchestrator';
import { requireUserId } from '@/lib/auth/session';
import { isDbEnabled } from '@/database/client';
import {
  createConversation, getConversation, touchConversation,
} from '@/database/queries/conversations';
import { insertMessage, listMessages } from '@/database/queries/messages';
import { memoryManager } from '@/zesta/memory/manager';
import type { ChatMessage } from '@/lib/ai/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(20_000),
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

  let userId: string | null = null;
  try {
    userId = isDbEnabled ? await requireUserId() : null;
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const abort = new AbortController();
  req.signal.addEventListener('abort', () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      let conversationId: string | null = parsed.conversationId ?? null;
      let history: ChatMessage[] = [];
      let memorySnippets: string[] = [];

      try {
        /* ── DB: resolve / create conversation + load history ─── */
        if (userId) {
          if (!conversationId) {
            const conv = await createConversation(userId, parsed.message.slice(0, 40));
            conversationId = conv.id;
            send({ type: 'conversation', id: conv.id, title: conv.title });
          } else {
            const conv = await getConversation(userId, conversationId);
            if (!conv) {
              send({ type: 'error', error: 'Conversation tidak ditemukan.' });
              return;
            }
          }

          const rows = await listMessages(conversationId);
          history = rows.map((r) => ({ role: r.role, content: r.content }));

          await insertMessage({
            conversationId,
            role: 'user',
            content: parsed.message,
          });

          /* ── Memory: retrieve context ──────────────────────── */
          try {
            const ctx = await memoryManager.buildContext({
              userId,
              query: parsed.message,
            });
            memorySnippets = ctx.snippets;
            if (memorySnippets.length > 0) {
              send({
                type: 'activity',
                activity: { kind: 'memory_update', label: `Mengingat ${memorySnippets.length} memori` },
              });
            }
          } catch (e) {
            console.warn('[chat] memory retrieve gagal:', e);
          }
        }

        /* ── Compose messages for agent ─────────────────────── */
        const memoryPrefix =
          memorySnippets.length > 0
            ? `Konteks memori tentang user (dari percakapan sebelumnya):\n${memorySnippets.join('\n')}\n\n`
            : '';

        const finalMessages: ChatMessage[] = [
          ...history,
          { role: 'user', content: memoryPrefix + parsed.message },
        ];

        /* ── Stream dari agent ──────────────────────────────── */
        let assistantText = '';

        for await (const evt of runChat({ messages: finalMessages, signal: abort.signal })) {
          if (evt.type === 'text' && evt.delta) {
            assistantText += evt.delta;
          }
          send(evt);
          if (evt.type === 'done' || evt.type === 'error') break;
        }

        /* ── DB: simpan assistant message + touch conversation ─ */
        if (userId && conversationId && assistantText) {
          await insertMessage({
            conversationId,
            role: 'assistant',
            content: assistantText,
          });
          await touchConversation(userId, conversationId);

          /* ── Memory: persist (non-blocking best-effort) ────── */
          try {
            await memoryManager.maybePersist({
              userId,
              conversationId,
              userMessage: parsed.message,
              assistantMessage: assistantText,
            });
          } catch (e) {
            console.warn('[chat] memory persist gagal:', e);
          }
        }
      } catch (err) {
        console.error('[api/chat] stream error:', err);
        send({ type: 'error', error: 'Internal error' });
      } finally {
        controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
