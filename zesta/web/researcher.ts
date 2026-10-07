import { webSearch, type SearchResult } from './search';
import { readUrl } from './reader';

export type ResearchActivityKind = 'researching' | 'reading' | 'verifying';

export type ResearchEvent =
  | { type: 'activity'; kind: ResearchActivityKind; label: string }
  | { type: 'source'; source: SearchResult & { content?: string } }
  | { type: 'context'; context: string; sources: SearchResult[] }
  | { type: 'error'; error: string };

export async function* research(
  query: string,
  opts: { maxSources?: number; signal?: AbortSignal } = {},
): AsyncIterable<ResearchEvent> {
  const max = opts.maxSources ?? 3;
  const signal = opts.signal;

  yield {
    type: 'activity',
    kind: 'researching',
    label: `Mencari "${query.slice(0, 40)}"`,
  };

  let results: SearchResult[] = [];
  try {
    results = await webSearch(query, 6, signal);
  } catch (err) {
    yield { type: 'error', error: `Gagal mencari: ${(err as Error).message}` };
    return;
  }

  if (results.length === 0) {
    yield { type: 'activity', kind: 'researching', label: 'Tidak ada hasil' };
    yield { type: 'context', context: '', sources: [] };
    return;
  }

  yield {
    type: 'activity',
    kind: 'researching',
    label: `Ditemukan ${results.length} hasil`,
  };

  const top = results.slice(0, max);
  const enriched: Array<SearchResult & { content?: string }> = [];

  for (let i = 0; i < top.length; i++) {
    const r = top[i];
    if (!r) continue;
    if (signal?.aborted) break;

    yield {
      type: 'activity',
      kind: 'reading',
      label: `Membaca sumber ${i + 1}/${top.length}`,
    };

    const read = await readUrl(r.url, signal);
    const item: SearchResult & { content?: string } = { ...r };
    if (read?.text) item.content = read.text;
    enriched.push(item);
    yield { type: 'source', source: item };
  }

  yield { type: 'activity', kind: 'verifying', label: 'Menyusun konteks' };

  const context = buildContext(query, enriched);
  yield { type: 'context', context, sources: enriched };
}

function buildContext(
  query: string,
  sources: Array<SearchResult & { content?: string }>,
): string {
  const lines: string[] = [];
  lines.push(`# Hasil riset web untuk: "${query}"`);
  lines.push('');

  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    if (!s) continue;
    lines.push(`## Sumber ${i + 1}: ${s.title}`);
    lines.push(`URL: ${s.url}`);
    if (s.snippet) lines.push(`Snippet: ${s.snippet}`);
    if (s.content) {
      lines.push('');
      lines.push('Konten:');
      lines.push(s.content.slice(0, 2500));
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(
    'Instruksi: Rangkum temuan di atas untuk user dalam Bahasa Indonesia. ' +
      'Sebutkan minimal 2 sumber beserta URL-nya. Jika ada ketidakcocokan antar sumber, sebutkan. ' +
      'Jangan mengarang fakta di luar konteks di atas.',
  );

  return lines.join('\n');
}
