import { env } from '@/lib/env';
import { writeEpisode } from './episodic';
import { writeSemantic } from './semantic';
import { retrieveForPrompt } from './retrieval';

/**
 * MemoryManager: satu pintu untuk read + write memory.
 *
 * Aturan Phase 2:
 * - TIDAK semua chat disimpan.
 * - Heuristik: pesan user yang mengandung fakta personal/preferensi
 *   atau topik teknis baru yang cukup panjang (> 60 char) disimpan
 *   sebagai semantic memory.
 * - Setiap conversation menghasilkan 1 episodic summary (setelah N turn).
 */

const PERSONAL_TRIGGERS = [
  /\bnama\s+saya\b/i,
  /\bsaya\s+(suka|tidak\s+suka|benci|ingin|butuh|sedang\s+belajar)\b/i,
  /\bingat(?:lah)?\b/i,
  /\bcall\s+me\b/i,
  /\bpanggil\s+saya\b/i,
];

const TECHNICAL_HINT = /\b(api|library|framework|function|class|algorithm|database|sql|typescript|javascript|python|rust|go|docker|kubernetes|react|next\.?js)\b/i;

function shouldStoreAsSemantic(userMessage: string): boolean {
  if (userMessage.length < 40) return false;
  if (PERSONAL_TRIGGERS.some((re) => re.test(userMessage))) return true;
  if (TECHNICAL_HINT.test(userMessage) && userMessage.length > 80) return true;
  return false;
}

export const memoryManager = {
  async buildContext(input: { userId: string; query: string }) {
    return retrieveForPrompt(input);
  },

  async maybePersist(input: {
    userId: string;
    conversationId: string;
    userMessage: string;
    assistantMessage: string;
  }) {
    if (!env.DATABASE_URL) return;

    // 1. Semantic: simpan ringkasan user message kalau layak
    if (shouldStoreAsSemantic(input.userMessage)) {
      const trimmed = input.userMessage.slice(0, 800);
      await writeSemantic({
        userId: input.userId,
        content: trimmed,
        source: `conversation:${input.conversationId}`,
        confidence: 0.6,
      }).catch((e) => console.warn('[memory.semantic]', e));
    }

    // 2. Episodic: simpan ringkasan singkat tiap turn
    const summary = `Percakapan tentang: "${input.userMessage.slice(0, 120)}"`;
    await writeEpisode({
      userId: input.userId,
      summary,
      conversationId: input.conversationId,
    }).catch((e) => console.warn('[memory.episodic]', e));
  },
};
