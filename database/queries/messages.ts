import { requireDb } from '@/database/client';

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta: Record<string, unknown>;
  created_at: Date;
}

export async function listMessages(conversationId: string, limit = 200) {
  const sql = requireDb();
  return sql<MessageRow[]>`
    SELECT * FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;
}

export async function insertMessage(input: {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: Record<string, unknown>;
}) {
  const sql = requireDb();
  const rows = await sql<MessageRow[]>`
    INSERT INTO messages (conversation_id, role, content, meta)
    VALUES (${input.conversationId}, ${input.role}, ${input.content}, ${sql.json(input.meta ?? {})})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Gagal menyimpan message.');
  return rows[0];
}
