export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const UA =
  'Mozilla/5.0 (compatible; ZestaBot/0.1; +https://zesta-agents-one.vercel.app)';

export async function webSearch(
  query: string,
  limit = 6,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    signal,
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`search HTTP ${res.status}`);
  }

  const html = await res.text();
  return parseDDGLite(html, limit);
}

function parseDDGLite(html: string, limit: number): SearchResult[] {
  const links: Array<{ url: string; title: string }> = [];
  const snippets: string[] = [];

  const anyA = /<a\b([^>]*)>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = anyA.exec(html)) !== null) {
    const attrs = m[1] ?? '';
    const inner = m[2] ?? '';
    if (!/\bclass=['"]result-link['"]/.test(attrs)) continue;
    const hrefMatch = /\bhref=['"]([^'"]+)['"]/.exec(attrs);
    if (!hrefMatch) continue;
    const rawUrl = hrefMatch[1] ?? '';
    if (!rawUrl) continue;
    links.push({
      url: normalizeDDGUrl(rawUrl),
      title: stripTags(inner).trim(),
    });
  }

  const snippetRe =
    /<td\b[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/g;
  while ((m = snippetRe.exec(html)) !== null) {
    snippets.push(stripTags(m[1] ?? '').trim());
  }

  const out: SearchResult[] = [];
  for (let i = 0; i < links.length && out.length < limit; i++) {
    const link = links[i];
    if (!link) continue;
    if (!link.url.startsWith('http')) continue;
    out.push({
      url: link.url,
      title: link.title || link.url,
      snippet: snippets[i] ?? '',
    });
  }
  return out;
}

function normalizeDDGUrl(url: string): string {
  if (url.startsWith('//duckduckgo.com/l/')) {
    try {
      const u = new URL('https:' + url);
      const real = u.searchParams.get('uddg');
      if (real) return decodeURIComponent(real);
    } catch {
      return url;
    }
  }
  if (url.startsWith('//')) return 'https:' + url;
  return url;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}
