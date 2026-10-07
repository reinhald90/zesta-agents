import { NextRequest, NextResponse } from 'next/server';
import { runMigrations } from '@/database/migrations/runner';
import { isDbEnabled } from '@/database/client';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Proteksi: butuh token = AUTH_SECRET
  const token = req.nextUrl.searchParams.get('token');
  if (!token || token !== env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isDbEnabled) {
    return NextResponse.json({ error: 'DATABASE_URL belum diset' }, { status: 503 });
  }

  try {
    await runMigrations();
    return NextResponse.json({ ok: true, message: 'Migration selesai.' });
  } catch (err) {
    console.error('[migrate]', err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
