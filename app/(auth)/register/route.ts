import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, findUserByEmail } from '@/database/queries/users';
import { isDbEnabled } from '@/database/client';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password minimal 8 karakter.'),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(req: NextRequest) {
  if (!isDbEnabled) {
    return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Input tidak valid.' },
        { status: 400 },
      );
    }
    const existing = await findUserByEmail(parsed.data.email);
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
    }
    const user = await createUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Gagal mendaftar.' }, { status: 500 });
  }
}
