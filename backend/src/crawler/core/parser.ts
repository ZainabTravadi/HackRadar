import * as cheerio from 'cheerio';

import type { RawHackathon } from '../../pipeline/normalizer';

export interface AdapterUrlPatterns {
  accept: RegExp[];
  reject: RegExp[];
}

export class Parser {
  private adapterPatterns: Map<string, AdapterUrlPatterns> = new Map();

  constructor() {
    this.adapterPatterns.set('mlh', {
      accept: [/events\.mlh\.io\/events\//i],
      reject: [/mlh\.io\/(?!events\/)/i, /\/assets\//i, /\/static\//i, /\.svg$/i, /discord/i, /careers/i, /sponsor/i],
    });
    this.adapterPatterns.set('devfolio', {
      accept: [/devfolio\.co\/hackathons\/[^/]+$/i],
      reject: [/devfolio\.co\/hackathons$/i, /devfolio\.co\/organize/i, /devfolio\.co\/explore/i, /devfolio\.co\/pricing/i, /devfolio\.co\/about/i, /devfolio\.co\/blog/i, /devfolio\.co\/help/i, /\/assets\//i, /\/static\//i],
    });
    this.adapterPatterns.set('hackerearth', {
      accept: [/hackerearth\.com\/(hackathon|challenge)\/[^/]+/i],
      reject: [/hackerearth\.com\/login/i, /hackerearth\.com\/signup/i, /hackerearth\.com\/logout/i, /hackerearth\.com\/competitive/i, /hackerearth\.com\/hiring/i, /hackerearth\.com\/university/i, /hackerearth\.com\/challenges\/?$/i, /\/assets\//i, /\/static\//i],
    });
    this.adapterPatterns.set('eventbrite', {
      accept: [/eventbrite\.com\/e\/[^/]+/i],
      reject: [/eventbrite\.com\/d\//i, /eventbrite\.com\/pricing/i, /eventbrite\.com\/contact/i, /eventbrite\.com\/community/i, /eventbrite\.com\/help/i, /eventbrite\.com\/blog/i, /eventbrite\.com\/news/i, /eventbrite\.com\/find/i, /eventbrite\.com\/qr/i, /eventbrite\.com\/assets/i, /eventbrite\.com\/static/i, /eventbrite\.com\/about/i, /eventbrite\.com\/career/i, /eventbrite\.com\/press/i, /eventbrite\.com\/privacy/i, /eventbrite\.com\/terms/i, /eventbrite\.com\/cookies/i, /eventbrite\.com\/accessibility/i, /facebook\.com/i, /instagram\.com/i, /tiktok\.com/i],
    });
    this.adapterPatterns.set('devpost', {
      accept: [/\/hackathons\/|\/hackathon\//i],
      reject: [/\/dashboard/i, /\/profile\//i, /\/guides?\//i, /\/docs?\//i, /\/blog\//i, /\/organizers?\//i, /\/organizers?$/i, /\/host-a-hackathon/i, /\/host-a-hackathons/i, /\/your-hackathons/i, /\/my-hackathons/i],
    });
    this.adapterPatterns.set('luma', {
      accept: [/lu\.ma\/[a-z0-9-]+$/i],
      reject: [/lu\.ma\/discover/i, /lu\.ma\/communities/i, /lu\.ma\/creators/i, /lu\.ma\/pricing/i, /lu\.ma\/app/i, /lu\.ma\/city\//i, /lu\.ma\/search/i, /\/assets\//i, /\/static\//i],
    });
    this.adapterPatterns.set('meetup', {
      accept: [/meetup\.com\/[^/]+\/events\/[^/]+/i],
      reject: [/meetup\.com\/find/i, /meetup\.com\/[^/]+\/?$/i, /meetup\.com\/[^/]+\/members/i, /meetup\.com\/[^/]+\/photos/i, /meetup\.com\/[^/]+\/discussions/i, /\/assets\//i, /\/static\//i],
    });
    this.adapterPatterns.set('github', {
      accept: [/github\.com\/[^/]+\/[^/]+\/issues\/\d+/i, /github\.com\/[^/]+\/[^/]+\/discussions\/\d+/i],
      reject: [/github\.com\/events/i, /github\.com\/[^/]+\/[^/]+\/pull\//i, /github\.com\/[^/]+\/[^/]+\/releases/i, /github\.com\/[^/]+\/[^/]+\/wiki/i, /github\.com\/[^/]+\/[^/]+\/settings/i, /github\.com\/[^/]+\/[^/]+\/actions/i, /github\.com\/[^/]+\/[^/]+\/security/i, /github\.com\/[^/]+\/[^/]+\/network/i, /github\.com\/[^/]+\/[^/]+\/pulse/i, /github\.com\/[^/]+\/[^/]+\/graphs/i, /github\.com\/[^/]+\/[^/]+\/blob/i, /github\.com\/[^/]+\/[^/]+\/tree/i, /github\.com\/[^/]+\/[^/]+\/commits/i, /github\.com\/[^/]+\/[^/]+\/branches/i, /github\.com\/[^/]+\/[^/]+\/tags/i, /github\.com\/[^/]+\/[^/]+\/stargazers/i, /github\.com\/[^/]+\/[^/]+\/forks/i, /github\.com\/[^/]+\/[^/]+\/watchers/i, /github\.com\/[^/]+\/[^/]+\/contributors/i, /\/assets\//i, /\/static\//i],
    });
    this.adapterPatterns.set('reddit', {
      accept: [/reddit\.com\/r\/hackathons\/comments\/[^/]+/i],
      reject: [/reddit\.com\/r\/hackathons\/?$/i, /reddit\.com\/user\//i, /reddit\.com\/r\/[^/]+\/about/i, /reddit\.com\/r\/[^/]+\/wiki/i, /reddit\.com\/comments\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/c\//i, /\/assets\//i, /\/static\//i],
    });
  }

  setAdapterPatterns(source: string, patterns: AdapterUrlPatterns): void {
    this.adapterPatterns.set(source, patterns);
  }

  parseHtml(html: string, source: string): RawHackathon[] {
    const $ = cheerio.load(html);
    $('script, style, noscript, svg, img, iframe').remove();
    $('[hidden], [aria-hidden="true"]').remove();

    const items: RawHackathon[] = [];
    const seen = new Set<string>();
    const candidateLinks = $('a[href]');

    const patterns = this.adapterPatterns.get(source);

    candidateLinks.each((_, element) => {
      const anchor = $(element);
      const href = this.normalizeHref(anchor.attr('href'));
      const title = this.extractTitle(anchor, $);
      const description = this.extractDescription(anchor, $);

      if (!href || !title) {
        return;
      }

      if (patterns && !this.matchesAcceptPattern(href, patterns.accept)) {
        return;
      }

      if (patterns && this.matchesRejectPattern(href, patterns.reject) || this.isLikelyNoise(title, href)) {
        return;
      }

      const parentText = this.cleanText(anchor.closest('footer, nav, header').text());
      if (parentText && parentText.length > 0 && title.length < 80 && this.isLikelyNavigationContext(title, parentText)) {
        return;
      }

      if (seen.has(href)) {
        return;
      }

      seen.add(href);
      items.push({
        title: this.cleanText(title),
        description: this.cleanText(description || title),
        sourceUrl: href,
        sourceId: href,
        source: source as RawHackathon['source'],
        organizerName: this.cleanText(this.extractOrganizer(anchor, $)) || undefined,
        locationText: this.cleanText(this.extractLocation(anchor, $)) || undefined,
        rawData: { html: html.slice(0, 1800), title: this.cleanText(title), href },
      });
    });

    return items.slice(0, 80);
  }

  private matchesAcceptPattern(url: string, patterns: RegExp[]): boolean {
    return patterns.length === 0 || patterns.some((p) => p.test(url));
  }

  private matchesRejectPattern(url: string, patterns: RegExp[]): boolean {
    return patterns.some((p) => p.test(url));
  }

  private extractTitle(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
    const titleAttr = this.cleanText(element.attr('title'));
    const ariaLabel = this.cleanText(element.attr('aria-label'));
    const directText = this.cleanText(element.text());
    if (directText) {
      return directText.replace(/\s+/g, ' ').slice(0, 140);
    }

    const heading = element.find('h1, h2, h3, h4, strong, b').first().text();
    const pageTitle = this.cleanText($('title').first().text());
    return this.cleanText(titleAttr || ariaLabel || heading || pageTitle).slice(0, 140);
  }

  private extractDescription(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
    const parentText = element.closest('li, div, article, section, p').text();
    const metaDescription = this.cleanText($('meta[name="description"]').attr('content'));
    return this.cleanText(parentText || metaDescription).slice(0, 320);
  }

  private extractOrganizer(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
    const byAttribute = this.cleanText(element.attr('data-organizer'));
    if (byAttribute) {
      return byAttribute;
    }

    return this.cleanText(element.closest('li, div, article').find('span, small').first().text()).slice(0, 120);
  }

  private extractLocation(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
    const byAttribute = this.cleanText(element.attr('data-location'));
    if (byAttribute) {
      return byAttribute;
    }

    return this.cleanText($('meta[name="geo.placename"]').attr('content') || $('meta[property="og:locale"]').attr('content') || '').slice(0, 120);
  }

  private cleanText(value: string | undefined): string {
    if (!value) {
      return '';
    }

    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
      const absolute = new URL(trimmed, 'https://example.com').toString();
      const parsed = new URL(absolute);
      if (/\.(svg|png|jpg|jpeg|gif|webp|ico|js|css|map|woff2?|ttf|eot|json|xml|txt|pdf|zip)(\?.*)?$/i.test(parsed.pathname)) {
        return null;
      }
      return absolute;
    } catch {
      return trimmed;
    }
  }

  private isLikelyNoise(title: string, href: string): boolean {
    const lowerTitle = title.toLowerCase();
    const lowerHref = href.toLowerCase();
    const navigationTerms = [
      'privacy', 'terms', 'login', 'logout', 'signup', 'sign up', 'pricing', 'help', 'contact',
      'support', 'documentation', 'docs', 'blog', 'news', 'resources', 'community', 'about',
      'careers', 'jobs', 'legal', 'cookies', 'accessibility', 'sitemap', 'press', 'media',
      'partners', 'sponsors', 'advertise', 'api', 'developers', 'status', 'changelog',
      'dashboard', 'profile', 'your hackathons', 'host a hackathon', 'host a hackathons',
      'my hackathons', 'organizer', 'organizers', 'guides', 'guide',
    ];
    const categoryTerms = [
      'all hackathons', 'upcoming', 'past', 'open', 'challenges', 'competitive',
      'find events', 'online events', 'marketplace', 'organizer', 'company',
      'university challenges', 'hiring challenges', 'explore', 'discover', 'browse',
      'categories', 'tags', 'topics', 'collections', 'curated',
    ];
    const singleWordTitles = ['login', 'logout', 'signup', 'pricing', 'help', 'community', 'home', 'discover', 'support', 'facebook', 'instagram', 'tiktok', 'find', 'tickets'];

    if (singleWordTitles.includes(lowerTitle.trim())) {
      return true;
    }

    return navigationTerms.some((term) => lowerTitle.includes(term) || lowerHref.includes(term)) ||
      categoryTerms.some((term) => lowerTitle.includes(term) || lowerHref.includes(term)) ||
      lowerHref.includes('/api/') || lowerHref.includes('/assets/') || lowerHref.includes('/static/');
  }

  private isLikelyNavigationContext(title: string, contextText: string): boolean {
    const lowerTitle = title.toLowerCase();
    const lowerContext = contextText.toLowerCase();
    const navigationWords = ['menu', 'navigation', 'home', 'about', 'contact', 'support', 'pricing', 'privacy', 'terms', 'docs', 'blog'];

    return navigationWords.some((term) => lowerContext.includes(term)) || lowerTitle === 'login' || lowerTitle === 'sign up';
  }
}
