import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth/session';
import { isDbEnabled } from '@/database/client';
import { createConversation, listConversations } from '@/database/queries/conversations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDbEnabled) return NextResponse.json({ conversations: [] });
  try {
    const userId = await requireUserId();
    const rows = await listConversations(userId);
    return NextResponse.json({
      conversations: rows.map((r) => ({
        id: r.id,
        title: r.title,
        updatedAt: new Date(r.updated_at).getTime(),
      })),
    });
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[conversations.GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST() {
  if (!isDbEnabled) return NextResponse.json({ error: 'DB disabled' }, { status: 503 });
  try {
    const userId = await requireUserId();
    const conv = await createConversation(userId);
    return NextResponse.json({
      conversation: { id: conv.id, title: conv.title, updatedAt: new Date(conv.updated_at).getTime() },
    }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[conversations.POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
