import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth/session';
import { isDbEnabled } from '@/database/client';
import {
  deleteConversation, getConversation, renameConversation,
} from '@/database/queries/conversations';
import { listMessages } from '@/database/queries/messages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbEnabled) return NextResponse.json({ error: 'DB disabled' }, { status: 503 });
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const conv = await getConversation(userId, id);
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const messages = await listMessages(id);
    return NextResponse.json({
      conversation: { id: conv.id, title: conv.title, updatedAt: new Date(conv.updated_at).getTime() },
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.created_at).getTime(),
      })),
    });
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[conversation.GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

const patchSchema = z.object({ title: z.string().min(1).max(120) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbEnabled) return NextResponse.json({ error: 'DB disabled' }, { status: 503 });
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    await renameConversation(userId, id, parsed.data.title);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[conversation.PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbEnabled) return NextResponse.json({ error: 'DB disabled' }, { status: 503 });
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await deleteConversation(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[conversation.DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
