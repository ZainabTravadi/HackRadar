import { normalize, type RawHackathon } from '../../pipeline/normalizer';

export interface ValidationIssue {
  sourceId: string;
  reason: string;
}

export interface EvidenceScore {
  total: number;
  breakdown: Record<string, number>;
  passed: boolean;
}

/**
 * Global Validator - Checks only generic event properties
 * 
 * Adapter-specific canonical URL validation should happen in individual adapters.
 * This validator ensures generic data quality without being overly restrictive.
 */
export class Validator {
  // Track first N rejections per source for debugging
  private rejectionLog: Map<string, { reason: string; count: number }[]> = new Map();
  private readonly MAX_REJECTIONS_TO_LOG = 10;

  private readonly blockedTitleTerms = [
    'login', 'logout', 'sign up', 'signup', 'sign in', 'signin', 'pricing', 'help center',
    'community', 'contact', 'support', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok',
    'documentation', 'blog', 'news', 'resources', 'about', 'privacy', 'terms', 'terms of service',
    'terms of use', 'cookie', 'legal', 'careers', 'jobs', 'hiring', 'press', 'media', 'brand',
    'assets', 'developers', 'api', 'status', 'security', 'compliance', 'sitemap', 'accessibility',
    'find tickets', 'event ticketing', 'qr codes', 'discover', 'explore', 'organize', 'create event',
    'manage events', 'my events', 'past events', 'upcoming events', 'browse', 'search', 'categories',
    'cities', 'countries', 'online', 'virtual', 'all events', 'see all', 'view all',
    'load more', 'show more', 'register', 'log in', 'join', 'get app',
    'download', 'contact sales', 'enterprise', 'solutions', 'features', 'integrations',
    'marketplace', 'partners', 'affiliates', 'referral', 'invite', 'settings', 'profile', 'account',
    'dashboard', 'notifications', 'messages', 'inbox', 'saved', 'bookmarks', 'history', 'activity',
    'following', 'followers', 'groups', 'communities', 'spaces', 'servers', 'channels', 'topics',
    'trending', 'popular', 'recommended', 'for you', 'personalized',
  ];

  private readonly blockedUrlPaths = [
    '/login', '/signup', '/signin', '/sign-up', '/sign-in', '/register', '/logout', '/signout',
    '/help', '/support', '/docs', '/documentation', '/pricing', '/pricing/', '/privacy', '/terms',
    '/about', '/contact', '/careers', '/jobs', '/assets/', '/images/', '/img/', '/css/', '/js/',
    '/fonts/', '/icons/', '/logo', '/static/', '/media/', '/cdn-cgi/', '/_next/', '/_nuxt/',
    '/api/', '/graphql', '/webhook', '/callback', '/auth/', '/oauth/', '/sso/', '/saml/',
    '/password/', '/reset/', '/verify/', '/confirm/', '/activate/', '/unsubscribe/',
    '/preferences/', '/settings/', '/account/', '/profile/', '/dashboard/', '/admin/',
    '/billing/', '/subscription/', '/invoice/', '/payment/', '/checkout/', '/cart/',
    '/search', '/browse', '/explore', '/discover', '/categories', '/category/', '/tag/',
    '/tags/', '/topic/', '/topics/', '/city/', '/cities/', '/country/', '/countries/',
    '/location/', '/locations/', '/venue/', '/venues/', '/organizer/', '/organizers/',
    '/creator/', '/creators/', '/host/', '/hosts/', '/community/', '/communities/',
    '/group/', '/groups/', '/space/', '/spaces/', '/server/', '/servers/',
    '/channel/', '/channels/', '/feed/', '/home/', '/index', '/main', '/app/',
    '/docs/', '/documentation/', '/guide/', '/guides/', '/tutorial/', '/tutorials/',
    '/reference/', '/api/', '/sdk/', '/cli/', '/changelog/', '/roadmap/', '/blog/',
    '/news/', '/press/', '/media/', '/brand/', '/assets/', '/resources/', '/help/',
    '/support/', '/faq/', '/faqs/', '/contact/', '/about/', '/team/', '/company/',
    '/careers/', '/jobs/', '/hiring/', '/legal/', '/privacy/', '/terms/', '/cookies/',
    '/gdpr/', '/ccpa/', '/security/', '/compliance/', '/status/', '/uptime/',
    '/sitemap', '/robots.txt', '/humans.txt', '/favicon.ico', '/manifest.json',
    '/sw.js', '/service-worker.js', '/workbox', '/_static/', '/_assets/',
  ];

  private readonly blockedUrlExtensions = [
    '.svg', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.bmp', '.tiff', '.avif',
    '.css', '.js', '.map', '.json', '.xml', '.pdf', '.txt', '.zip', '.tar', '.gz',
    '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.webm', '.mov', '.avi',
    '.mp3', '.wav', '.ogg', '.flac', '.csv', '.xlsx', '.docx', '.pptx',
  ];

  private readonly navigationPagePatterns = [
    'all hackathons', 'upcoming hackathons', 'past hackathons', 'open hackathons',
    'hackathon directory', 'hackathon list', 'hackathon calendar', 'find hackathons',
    'browse hackathons', 'hackathon categories', 'hackathon tags', 'hackathon search',
    'all events', 'upcoming events', 'past events', 'event directory', 'event list',
    'event calendar', 'find events', 'browse events', 'event categories', 'event tags',
    'all challenges', 'upcoming challenges', 'past challenges', 'challenge directory',
    'competitive challenges', 'hiring challenges', 'university challenges', 'practice challenges',
    'discover events', 'explore events', 'community events', 'online events', 'city events',
    'creator profiles', 'organizer profiles', 'community home', 'group home',
    'subreddit', 'r/', 'user/', 'u/', 'comments', 'post/', 'thread/',
    'issues', 'pull', 'pulls', 'releases', 'discussions', 'wiki', 'pulse', 'graphs',
    'network', 'settings', 'security', 'codespaces', 'actions', 'packages', 'projects',
  ];

  private readonly navigationUrlPatterns = [
    '/hackathons$', '/hackathons/', '/events$', '/events/', '/challenges$', '/challenges/',
    '/competitions$', '/competitions/', '/contests$', '/contests/', '/marketplace',
    '/organize', '/create', '/host', '/pricing', '/plans', '/billing', '/subscription',
    '/discover', '/explore', '/browse', '/search', '/categories', '/tags', '/topics',
    '/cities', '/countries', '/locations', '/venues', '/organizers', '/creators',
    '/communities', '/groups', '/spaces', '/servers', '/profile', '/account',
    '/settings', '/dashboard', '/notifications', '/messages', '/inbox', '/saved',
    '/bookmarks', '/history', '/activity', '/following', '/followers',
  ];

  // Evidence weights for scoring
  private readonly evidenceWeights = {
    registrationDeadline: 5,
    submissionDeadline: 5,
    title: 3,
    organizer: 3,
    prize: 2,
    location: 2,
    mode: 2,
    description: 2,
    canonicalUrl: 3,
    applicationLink: 3,
  } as const;

  private readonly MIN_EVIDENCE_SCORE = 8; // Configurable minimum threshold

  // Canonical URL patterns per source - only these patterns are valid event URLs
  private readonly canonicalUrlPatterns: Record<string, RegExp[]> = {
    devpost: [/^https?:\/\/devpost\.com\/software\/[^/]+$/i],
    mlh: [/^https?:\/\/mlh\.io\/seasons\/[^/]+\/events\/[^/]+$/i],
    devfolio: [/^https?:\/\/devfolio\.co\/hackathons\/[^/]+$/i],
    unstop: [/^https?:\/\/unstop\.com\/hackathons\/[^/]+$/i],
    dorahacks: [/^https?:\/\/dorahacks\.io\/hackathon\/[^/]+$/i],
    taikai: [/^https?:\/\/taikai\.network\/hackathons\/[^/]+$/i],
    hackerearth: [/^https?:\/\/www\.hackerearth\.com\/challenges\/hackathon\/[^/]+$/i],
    hack2skill: [/^https?:\/\/hack2skill\.com\/hackathon\/[^/]+$/i],
    reskilll: [/^https?:\/\/reskilll\.com\/hackathon\/[^/]+$/i],
    lablab: [/^https?:\/\/lablab\.ai\/event\/[^/]+$/i],
    ethglobal: [/^https?:\/\/ethglobal\.com\/events\/[^/]+$/i],
    angelhack: [/^https?:\/\/angelhack\.com\/hackathons\/[^/]+$/i],
    hackclub: [/^https?:\/\/hackclub\.com\/hackathons\/[^/]+$/i],
    university: [/^https?:\/\/[^/]+\.edu\/hackathon[s]?\/[^/]+$/i],
    eventbrite: [/^https?:\/\/www\.eventbrite\.com\/e\/[^/]+\-\d+$/i],
    luma: [/^https?:\/\/lu\.ma\/[a-z0-9-]+$/i],
    meetup: [/^https?:\/\/www\.meetup\.com\/[^/]+\/events\/[^/]+$/i],
    github: [/^https?:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/i],
    reddit: [/^https?:\/\/www\.reddit\.com\/r\/hackathons\/comments\/[^/]+$/i],
    discord: [/^https?:\/\/discord\.com\/channels\/[^/]+\/[^/]+$/i],
    telegram: [/^https?:\/\/t\.me\/[^/]+$/i],
    linkedin: [/^https?:\/\/www\.linkedin\.com\/posts\/[^/]+\/activity-\d+$/i],
    twitter: [/^https?:\/\/twitter\.com\/[^/]+\/status\/\d+$/i],
    facebook: [/^https?:\/\/www\.facebook\.com\/events\/\d+$/i],
    google: [/^https?:\/\/events\.google\.com\/[^/]+$/i],
  };

  validate(raw: RawHackathon): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const title = this.cleanText(raw.title);
    const sourceUrl = this.cleanText(raw.sourceUrl);
    const sourceId = this.cleanText(raw.sourceId);
    const source = raw.source;

    // REQUIRED: Title
    if (!title) {
      const reason = 'missing title';
      this.logRejection(source, reason);
      return [{ sourceId, reason }];
    }

    // REQUIRED: Valid URL
    if (!sourceUrl || !this.isValidUrl(sourceUrl)) {
      const reason = 'missing or invalid url';
      this.logRejection(source, reason);
      return [{ sourceId, reason }];
    }

    // REQUIRED: Source ID
    if (!sourceId) {
      const reason = 'missing source id';
      this.logRejection(source, reason);
      return [{ sourceId, reason }];
    }

    // GENERIC: Title length
    if (title.length < 5 || title.length > 300) {
      const reason = `title length invalid (${title.length})`;
      this.logRejection(source, reason);
      issues.push({ sourceId, reason });
    }

    // GENERIC: Blocked title terms
    if (this.isBlockedTitle(title)) {
      const reason = 'blocked title (navigation/non-event page)';
      this.logRejection(source, reason);
      issues.push({ sourceId, reason });
    }

    // GENERIC: Placeholder or overly generic title
    if (this.isPlaceholderTitle(title, raw.description || '')) {
      const reason = 'placeholder title or incomplete event';
      this.logRejection(source, reason);
      issues.push({ sourceId, reason });
    }

    // GENERIC: Obvious navigation pages
    if (this.isNavigationPage(title, sourceUrl)) {
      const reason = 'navigation/directory page pattern';
      this.logRejection(source, reason);
      issues.push({ sourceId, reason });
    }

    // GENERIC: Asset or API endpoint
    if (this.isAssetOrApiEndpoint(sourceUrl)) {
      const reason = 'asset or api endpoint url';
      this.logRejection(source, reason);
      issues.push({ sourceId, reason });
    }

    // GENERIC: Blocked file extensions
    if (this.isBlockedExtension(sourceUrl)) {
      const reason = 'blocked file extension';
      this.logRejection(source, reason);
      issues.push({ sourceId, reason });
    }

    // GENERIC: HTML artifacts in title or description
    if (this.hasHtmlArtifacts(title) || this.hasHtmlArtifacts(raw.description || '')) {
      const reason = 'html artifacts in content';
      this.logRejection(source, reason);
      issues.push({ sourceId, reason });
    }

    // GENERIC: Impossible dates (before 2020 or after 2035) - only reject if date exists and is malformed
    // Do NOT reject if date is missing, null, or partial (e.g., "TBA", "August 2026")
    if (this.hasImpossibleDate(raw)) {
      const reason = 'impossible date (outside 2020-2035 range)';
      this.logRejection(source, reason);
      issues.push({ sourceId, reason });
    }

    return issues;
  }

  /**
   * Log rejection reasons for debugging (first 10 per source)
   */
  private logRejection(source: string, reason: string): void {
    // Placeholder for future logging
  }

  /**
   * Print rejection logs for debugging
   */
  printRejectionLogs(): void {
    // Placeholder for future logging
  }

  /**
   * Reset rejection logs
   */
  resetRejectionLogs(): void {
    // Placeholder for future logging
  }

  calculateEvidenceScore(raw: RawHackathon): EvidenceScore {
    return {
      total: 0,
      breakdown: {},
      passed: true, // Always pass - evidence scoring moved to individual adapters if needed
    };
  }

  private cleanText(value: string | undefined): string {
    if (!value) return '';
    return value.replace(/\s+/g, ' ').trim();
  }

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private isBlockedTitle(title: string): boolean {
    const normalized = title.toLowerCase();
    return this.blockedTitleTerms.some((term) => normalized === term || normalized.includes(term));
  }

  private isNavigationPage(title: string, url: string): boolean {
    const normalizedTitle = title.toLowerCase();
    const normalizedUrl = url.toLowerCase();
    return this.navigationPagePatterns.some(
      (pattern) => normalizedTitle.includes(pattern) || normalizedUrl.includes(pattern)
    );
  }

  private isPlaceholderTitle(title: string, description: string): boolean {
    const normalizedTitle = title.toLowerCase().trim();
    const genericTitles = ['hackathon', 'event', 'upcoming event', 'upcoming hackathon', 'challenge', 'competition', 'hack', 'build', 'hackathon event'];
    const hasGenericTitle = genericTitles.includes(normalizedTitle) || normalizedTitle.includes('hackathon') && normalizedTitle.length <= 12;
    const missingDescription = !description.trim() && hasGenericTitle;
    return hasGenericTitle || missingDescription;
  }

  private isAssetOrApiEndpoint(url: string): boolean {
    const normalized = url.toLowerCase();
    return (
      normalized.includes('/api/') ||
      normalized.includes('/assets/') ||
      normalized.includes('/static/') ||
      normalized.includes('/images/') ||
      normalized.includes('/_next/') ||
      normalized.includes('/_nuxt/')
    );
  }

  private isBlockedExtension(url: string): boolean {
    const normalized = url.toLowerCase();
    return this.blockedUrlExtensions.some((ext) => normalized.endsWith(ext) || normalized.includes(ext + '?'));
  }

  private hasHtmlArtifacts(text: string): boolean {
    if (!text) return false;
    const normalized = text.toLowerCase();
    return (
      normalized.includes('<span') ||
      normalized.includes('<div') ||
      normalized.includes('&nbsp;') ||
      normalized.includes('<br') ||
      normalized.includes('<p') ||
      normalized.includes('&lt;') ||
      normalized.includes('&gt;')
    );
  }

  private hasImpossibleDate(raw: RawHackathon): boolean {
    const dateFields = [
      raw.registrationDeadline,
      raw.submissionDeadline,
      raw.startDate,
      raw.endDate,
    ].filter(Boolean) as Date[];

    for (const date of dateFields) {
      if (!date) continue;

      // Check if date is actually a valid Date object
      if (isNaN(date.getTime())) {
        return true; // Invalid date
      }

      const year = date.getFullYear();
      if (year < 2020 || year > 2035) {
        return true; // Impossible year
      }
    }

    return false;
  }
}