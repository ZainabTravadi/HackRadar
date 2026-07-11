import type { RawHackathon } from '../../../pipeline/normalizer';

export function parseMlhPayload(html: string): RawHackathon[] {
  const matches = Array.from(html.matchAll(/https?:\/\/[^"'\s<>]+/g));
  const items: RawHackathon[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const url = match[0];
    const title = url.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'MLH event';
    if (!url.includes('mlh.io') || seen.has(url)) {
      continue;
    }

    seen.add(url);
    items.push({
      title: title.replace(/\b\w/g, (char) => char.toUpperCase()),
      description: `MLH event from ${url}`,
      sourceUrl: url,
      sourceId: url,
      source: 'mlh',
      rawData: { html: html.slice(0, 1200), url },
    });
  }

  return items.slice(0, 25);
}
