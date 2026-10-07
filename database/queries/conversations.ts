import { requireDb } from '@/database/client';

export interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export async function listConversations(userId: string, limit = 100) {
  const sql = requireDb();
  return sql<ConversationRow[]>`
    SELECT * FROM conversations
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `;
}

export async function createConversation(userId: string, title = 'New Chat') {
  const sql = requireDb();
  const rows = await sql<ConversationRow[]>`
    INSERT INTO conversations (user_id, title)
    VALUES (${userId}, ${title})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Gagal membuat conversation.');
  return rows[0];
}

export async function getConversation(userId: string, id: string) {
  const sql = requireDb();
  const rows = await sql<ConversationRow[]>`
    SELECT * FROM conversations
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function renameConversation(userId: string, id: string, title: string) {
  const sql = requireDb();
  await sql`
    UPDATE conversations SET title = ${title}, updated_at = now()
    WHERE id = ${id} AND user_id = ${userId}
  `;
}

export async function touchConversation(userId: string, id: string) {
  const sql = requireDb();
  await sql`
    UPDATE conversations SET updated_at = now()
    WHERE id = ${id} AND user_id = ${userId}
  `;
}

export async function deleteConversation(userId: string, id: string) {
  const sql = requireDb();
  await sql`
    DELETE FROM conversations WHERE id = ${id} AND user_id = ${userId}
  `;
}
