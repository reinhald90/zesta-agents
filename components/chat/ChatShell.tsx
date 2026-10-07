'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Sidebar, type ConversationMeta } from './Sidebar';
import { Composer } from './Composer';
import { MessageBubble, type ChatMsg } from './MessageBubble';
import { ActivityCard } from './ActivityCard';
import type { AgentStreamEvent, ActivityEvent } from '@/zesta/core/agent';

interface Conversation extends ConversationMeta {
  messages: ChatMsg[];
}

export function ChatShell({ userEmail }: { userEmail?: string | null }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [streamText, setStreamText] = useState('');
  const [modelLabel, setModelLabel] = useState('Loading…');

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Load conversation list ───────────────────────────────── */
  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => r.json())
      .then((d: { conversations?: ConversationMeta[] }) => {
        const list = d.conversations ?? [];
        setConversations(list.map((c) => ({ ...c, messages: [] })));
        if (list[0]) setActiveId(list[0].id);
      })
      .catch(() => {});
  }, []);

  /* ── Model info ───────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    fetch('/api/config')
      .then((r) => r.json())
      .then((d: { label?: string }) => mounted && setModelLabel(d.label ?? 'Auto'))
      .catch(() => mounted && setModelLabel('Auto'));
    return () => { mounted = false; };
  }, []);

  /* ── Load messages for active conversation ────────────────── */
  useEffect(() => {
    if (!activeId) return;
    const existing = conversations.find((c) => c.id === activeId);
    if (existing && existing.messages.length > 0) return;

    fetch(`/api/conversations/${activeId}`)
      .then((r) => r.json())
      .then((d: { messages?: Array<{ id: string; role: 'user' | 'assistant'; content: string }> }) => {
        const msgs: ChatMsg[] = (d.messages ?? []).map((m) => ({
          id: m.id, role: m.role, content: m.content,
        }));
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, messages: msgs } : c)),
        );
      })
      .catch(() => {});
  }, [activeId, conversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const meta: ConversationMeta[] = conversations.map((c) => ({
    id: c.id, title: c.title, updatedAt: c.updatedAt,
  }));

  /* ── Actions ─────────────────────────────────────────────── */
  const newChat = useCallback(() => {
    // conversation baru dibuat oleh server saat pesan pertama dikirim
    setActiveId(null);
    setActivities([]);
    setStreamText('');
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveId(id);
    setActivities([]);
    setStreamText('');
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  /* ── Send ────────────────────────────────────────────────── */
  const send = useCallback(
    async (text: string) => {
      if (busy) return;

      const localId = nanoid(8);
      const userMsg: ChatMsg = { id: localId, role: 'user', content: text };

      // Optimistic: tampilkan user msg di conversation aktif
      let convId = activeId;
      if (!convId) {
        convId = `pending-${localId}`;
        const placeholder: Conversation = {
          id: convId,
          title: text.slice(0, 40),
          updatedAt: Date.now(),
          messages: [userMsg],
        };
        setConversations((prev) => [placeholder, ...prev]);
        setActiveId(convId);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, title: c.messages.length === 0 ? text.slice(0, 40) : c.title, messages: [...c.messages, userMsg] }
              : c,
          ),
        );
      }

      setBusy(true);
      setActivities([]);
      setStreamText('');

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      let assistantText = '';
      let realConversationId: string | null = activeId;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeId ?? undefined,
            message: text,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const raw = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 2);
            if (!raw.startsWith('data:')) continue;
            const payload = raw.slice(5).trim();
            if (!payload) continue;

            let evt: AgentStreamEvent;
            try { evt = JSON.parse(payload); } catch { continue; }

            if (evt.type === 'conversation' && evt.id) {
              realConversationId = evt.id;
              // Rename placeholder → id asli dari server
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === convId
                    ? { ...c, id: evt.id!, title: evt.title ?? c.title }
                    : c,
                ),
              );
              setActiveId(evt.id);
            } else if (evt.type === 'activity' && evt.activity) {
              setActivities((prev) => [...prev, evt.activity!]);
            } else if (evt.type === 'text' && evt.delta) {
              assistantText += evt.delta;
              setStreamText(assistantText);
            } else if (evt.type === 'error') {
              assistantText = `⚠️ ${evt.error}`;
              setStreamText(assistantText);
            } else if (evt.type === 'done') {
              break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          assistantText = assistantText || `⚠️ ${(err as Error).message}`;
        }
      } finally {
        abortRef.current = null;
        setBusy(false);

        if (assistantText && realConversationId) {
          const botMsg: ChatMsg = {
            id: nanoid(8), role: 'assistant', content: assistantText,
          };
          setConversations((prev) =>
            prev.map((c) =>
              c.id === realConversationId
                ? { ...c, updatedAt: Date.now(), messages: [...c.messages, botMsg] }
                : c,
            ),
          );
        }
        setStreamText('');
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight, behavior: 'smooth',
          });
        }, 30);
      }
    },
    [activeId, busy],
  );

  /* ── Auto-scroll ─────────────────────────────────────────── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.messages.length, streamText, activities.length]);

  return (
    <div className="flex h-[100dvh] w-full">
      <Sidebar
        conversations={meta}
        activeId={activeId}
        onNew={newChat}
        onSelect={selectChat}
        onDelete={deleteChat}
        userEmail={userEmail}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight">
              {active?.title ?? 'Zesta Chat'}
            </h1>
            <p className="text-[11px] text-ink-faint">Agent · Memory · Learning</p>
          </div>
          <div className="hidden items-center gap-2 text-[11px] text-ink-muted sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Online
          </div>
        </div>

        <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
            {(!active || active.messages.length === 0) && !streamText && (
              <EmptyState onPick={(t) => send(t)} />
            )}

            {active?.messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}

            {(activities.length > 0 || streamText) && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {activities.map((a, i) => (
                    <ActivityCard
                      key={i}
                      kind={a.kind}
                      label={a.label}
                      live={busy && i === activities.length - 1}
                    />
                  ))}
                </div>
                {streamText && (
                  <MessageBubble
                    msg={{ id: 'stream', role: 'assistant', content: streamText }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <Composer onSend={send} onStop={stop} busy={busy} modelLabel={modelLabel} />
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  const items = [
    'Zesta, jelaskan apa itu WebSocket.',
    'Pelajari dasar Rust dan ringkas dalam 5 poin.',
    'Bandingkan Postgres vs SQLite untuk project kecil.',
    'Buatkan contoh fetch API di TypeScript.',
  ];
  return (
    <div className="mt-10 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-cyan glow-ring">
        <span className="text-lg font-bold text-white">Z</span>
      </div>
      <h2 className="text-xl font-semibold tracking-tight">Halo, aku Zesta.</h2>
      <p className="mt-1 text-sm text-ink-muted">Mulai dengan salah satu contoh ini.</p>
      <div className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((t) => (
          <button
            key={t}
            onClick={() => onPick(t)}
            className="glass rounded-xl px-3 py-2.5 text-left text-sm text-ink-muted transition hover:-translate-y-0.5 hover:text-ink"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
                                 }
