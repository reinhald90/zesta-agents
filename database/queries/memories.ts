import { requireDb } from '@/database/client';

export interface MemoryRow {
  id: string;
  scope: 'global' | 'user';
  user_id: string | null;
  type: 'episodic' | 'semantic' | 'skill';
  content: string;
  source: string | null;
  confidence: number;
  relevance: number;
  created_at: Date;
}

export async function insertMemory(input: {
  scope: 'global' | 'user';
  userId: string | null;
  type: 'episodic' | 'semantic' | 'skill';
  content: string;
  source?: string;
  confidence?: number;
  relevance?: number;
  embedding?: number[] | null;
  meta?: Record<string, unknown>;
}) {
  const sql = requireDb();
  const vec = input.embedding ? `[${input.embedding.join(',')}]` : null;

  const rows = await sql<MemoryRow[]>`
    INSERT INTO memories (scope, user_id, type, content, source, confidence, relevance, embedding, meta)
    VALUES (
      ${input.scope},
      ${input.userId},
      ${input.type},
      ${input.content},
      ${input.source ?? null},
      ${input.confidence ?? 0.5},
      ${input.relevance ?? 0.5},
      ${vec ? sql`${vec}::vector` : null},
      ${sql.json(input.meta ?? {})}
    )
    RETURNING id, scope, user_id, type, content, source, confidence, relevance, created_at
  `;
  if (!rows[0]) throw new Error('Gagal menyimpan memory.');
  return rows[0];
}

export async function searchMemoriesByVector(input: {
  userId: string;
  embedding: number[];
  limit?: number;
}): Promise<Array<MemoryRow & { similarity: number }>> {
  const sql = requireDb();
  const vec = `[${input.embedding.join(',')}]`;
  const limit = input.limit ?? 6;

  return sql<Array<MemoryRow & { similarity: number }>>`
    SELECT id, scope, user_id, type, content, source, confidence, relevance, created_at,
           1 - (embedding <=> ${sql.unsafe(vec)}::vector) AS similarity
    FROM memories
    WHERE ((scope = 'user' AND user_id = ${input.userId}) OR scope = 'global')
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${sql.unsafe(vec)}::vector
    LIMIT ${limit}
  `;
}

export async function countMemories(userId: string) {
  const sql = requireDb();
  const rows = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM memories
    WHERE (scope = 'user' AND user_id = ${userId}) OR scope = 'global'
  `;
  return rows[0]?.count ?? 0;
}
