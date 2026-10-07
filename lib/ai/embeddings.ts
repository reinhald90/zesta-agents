import { env } from '@/lib/env';

/**
 * Embedding via Gemini. Kalau GEMINI_API_KEY kosong → return null (memory
 * tetap disimpan tapi tanpa vector — retrieval fallback ke recency).
 */
export async function embed(text: string): Promise<number[] | null> {
  if (!env.GEMINI_API_KEY) return null;

  const model = env.GEMINI_EMBEDDING_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${env.GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    });
    if (!res.ok) {
      console.warn('[embed] gagal:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json = (await res.json()) as { embedding?: { values?: number[] } };
    return json.embedding?.values ?? null;
  } catch (err) {
    console.warn('[embed] error:', err);
    return null;
  }
}
