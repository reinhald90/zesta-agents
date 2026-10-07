import { insertMemory } from '@/database/queries/memories';
import { isDbEnabled } from '@/database/client';

/**
 * Episodic memory: "user pernah membahas X dalam conversation Y pada tanggal Z."
 */
export async function writeEpisode(input: {
  userId: string;
  summary: string;
  conversationId: string;
  meta?: Record<string, unknown>;
}) {
  if (!isDbEnabled) return null;
  return insertMemory({
    scope: 'user',
    userId: input.userId,
    type: 'episodic',
    content: input.summary,
    source: `conversation:${input.conversationId}`,
    confidence: 0.8,
    meta: { conversationId: input.conversationId, ...input.meta },
  });
}
