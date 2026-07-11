import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../pipeline/normalizer';

export class Parser {
  parseHtml(html: string, source: string): RawHackathon[] {
    const $ = cheerio.load(html);
    const items: RawHackathon[] = [];
    const seen = new Set<string>();

    const candidateLinks = $('a[href]');

    candidateLinks.each((_, element) => {
      const href = $(element).attr('href');
      const title = this.extractTitle($(element), $).trim();
      const normalizedHref = this.normalizeHref(href);

      if (!normalizedHref || !title || this.isLikelyNoise(title, normalizedHref)) {
        return;
      }

      if (seen.has(normalizedHref)) {
        return;
      }

      seen.add(normalizedHref);
      items.push({
        title,
        description: title,
        sourceUrl: normalizedHref,
        sourceId: normalizedHref,
        source: source as RawHackathon['source'],
        rawData: { html: html.slice(0, 1200), title, href: normalizedHref },
      });
    });

    return items.slice(0, 100);
  }

  private extractTitle(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
    const directText = element.text().trim();
    if (directText) {
      return directText.replace(/\s+/g, ' ').slice(0, 120);
    }

    const title = element.find('h1, h2, h3, h4, strong, b').first().text().trim();
    return title.replace(/\s+/g, ' ').slice(0, 120);
  }

  private normalizeHref(href: string | undefined): string | null {
    if (!href) {
      return null;
    }

    const trimmed = href.trim();
    if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:')) {
      return null;
    }

    try {
      return new URL(trimmed, 'https://example.com').toString();
    } catch {
      return trimmed;
    }
  }

  private isLikelyNoise(title: string, href: string): boolean {
    const lowerTitle = title.toLowerCase();
    const lowerHref = href.toLowerCase();
    return lowerTitle.includes('privacy') || lowerTitle.includes('terms') || lowerTitle.includes('login') || lowerHref.includes('privacy') || lowerHref.includes('terms') || lowerHref.includes('mailto:');
  }
}
