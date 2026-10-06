import { requireDb } from '@/database/client';
import bcrypt from 'bcryptjs';

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  created_at: Date;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const sql = requireDb();
  const rows = await sql<UserRow[]>`
    SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ id: string; email: string; name: string | null }> {
  const sql = requireDb();
  const hash = await bcrypt.hash(input.password, 10);
  const rows = await sql<{ id: string; email: string; name: string | null }[]>`
    INSERT INTO users (email, name, password_hash)
    VALUES (${input.email.toLowerCase()}, ${input.name ?? null}, ${hash})
    RETURNING id, email, name
  `;
  if (!rows[0]) throw new Error('Gagal membuat user.');
  return rows[0];
}

export async function verifyPassword(user: UserRow, plain: string): Promise<boolean> {
  return bcrypt.compare(plain, user.password_hash);
}
