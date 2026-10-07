import { embed } from '@/lib/ai/embeddings';
import { insertMemory, searchMemoriesByVector } from '@/database/queries/memories';
import { isDbEnabled } from '@/database/client';

export interface SemanticHit {
  content: string;
  similarity: number;
  source: string | null;
}

export async function writeSemantic(input: {
  userId: string;
  content: string;
  source?: string;
  confidence?: number;
}) {
  if (!isDbEnabled) return null;
  const vector = await embed(input.content);
  return insertMemory({
    scope: 'user',
    userId: input.userId,
    type: 'semantic',
    content: input.content,
    source: input.source,
    confidence: input.confidence ?? 0.6,
    embedding: vector,
  });
}

export async function retrieveSemantic(input: {
  userId: string;
  query: string;
  limit?: number;
}): Promise<SemanticHit[]> {
  if (!isDbEnabled) return [];
  const vector = await embed(input.query);
  if (!vector) return [];

  const rows = await searchMemoriesByVector({
    userId: input.userId,
    embedding: vector,
    limit: input.limit ?? 6,
  });

  return rows
    .filter((r) => r.similarity > 0.55)
    .map((r) => ({ content: r.content, similarity: r.similarity, source: r.source }));
}
