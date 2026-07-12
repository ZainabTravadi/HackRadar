import * as cheerio from 'cheerio';

export type PageClassification = 
  | 'EVENT'
  | 'CATEGORY'
  | 'NAVIGATION'
  | 'LANDING'
  | 'LOGIN'
  | 'BLOG'
  | 'HELP'
  | 'PRICING'
  | 'SOCIAL'
  | 'ASSET'
  | 'DOCUMENTATION'
  | 'SEARCH'
  | 'PROFILE'
  | 'UNKNOWN';

export interface ClassificationResult {
  classification: PageClassification;
  confidence: number;
  reasons: string[];
}

const classificationPatterns: Record<PageClassification, { url: RegExp[]; title: RegExp[]; body: RegExp[] }> = {
  EVENT: {
    url: [
      /\/events?\/[^/]+/i,
      /\/hackathons?\/[^/]+/i,
      /\/challenges?\/[^/]+/i,
      /\/competitions?\/[^/]+/i,
      /\/contests?\/[^/]+/i,
      /\/e\/[^/]+/i,
      /lu\.ma\/[a-z0-9-]+$/i,
      /\/meetup\.com\/[^/]+\/events\/[^/]+/i,
      /\/issues\/\d+$/i,
      /\/discussions\/\d+$/i,
      /\/comments\/[^/]+$/i,
    ],
    title: [
      /hackathon/i,
      /challenge/i,
      /summit/i,
      /contest/i,
      /competition/i,
      /jam/i,
      /camp/i,
      /workshop/i,
      /meetup/i,
      /conference/i,
      /hack/i,
      /build/i,
      /code/i,
    ],
    body: [
      /registration.*deadline/i,
      /submission.*deadline/i,
      /prize/i,
      /organizer/i,
      /venue/i,
      /location/i,
      /apply.*now/i,
      /register.*now/i,
      /starts?\s+on/i,
      /ends?\s+on/i,
      /date.*time/i,
    ],
  },
  CATEGORY: {
    url: [
      /\/hackathons\/?$/i,
      /\/events\/?$/i,
      /\/challenges\/?$/i,
      /\/competitions\/?$/i,
      /\/contests\/?$/i,
      /\/discover/i,
      /\/explore/i,
      /\/browse/i,
      /\/find/i,
      /\/categories/i,
      /\/tags/i,
      /\/topics/i,
      /\/cities/i,
      /\/countries/i,
    ],
    title: [
      /^all\s+hackathons$/i,
      /^upcoming\s+hackathons$/i,
      /^past\s+hackathons$/i,
      /^all\s+events$/i,
      /^upcoming\s+events$/i,
      /^past\s+events$/i,
      /^all\s+challenges$/i,
      /competitive\s+challenges/i,
      /hiring\s+challenges/i,
      /university\s+challenges/i,
      /discover\s+events/i,
      /explore\s+events/i,
      /browse\s+events/i,
      /community\s+events/i,
      /online\s+events/i,
      /city\s+events/i,
    ],
    body: [
      /view\s+all/i,
      /see\s+all/i,
      /load\s+more/i,
      /show\s+more/i,
      /filter\s+by/i,
      /sort\s+by/i,
    ],
  },
  NAVIGATION: {
    url: [
      /\/login/i,
      /\/signup/i,
      /\/signin/i,
      /\/register/i,
      /\/logout/i,
      /\/help/i,
      /\/support/i,
      /\/docs/i,
      /\/documentation/i,
      /\/pricing/i,
      /\/privacy/i,
      /\/terms/i,
      /\/about/i,
      /\/contact/i,
      /\/careers/i,
      /\/jobs/i,
      /\/blog/i,
      /\/news/i,
      /\/resources/i,
      /\/community/i,
      /\/partners/i,
      /\/sponsors/i,
      /\/api/i,
      /\/developers/i,
      /\/status/i,
      /\/sitemap/i,
      /\/legal/i,
      /\/cookies/i,
      /\/accessibility/i,
    ],
    title: [
      /^login$/i,
      /^logout$/i,
      /^sign\s+up$/i,
      /^signup$/i,
      /^pricing$/i,
      /^help$/i,
      /^support$/i,
      /^community$/i,
      /^contact$/i,
      /^about$/i,
      /^privacy$/i,
      /^terms$/i,
      /^careers$/i,
      /^documentation$/i,
      /^blog$/i,
      /^news$/i,
      /^resources$/i,
      /^documentation$/i,
    ],
    body: [
      /navigation|menu|header|footer/i,
    ],
  },
  LANDING: {
    url: [
      /^https?:\/\/[^/]+\/?$/i,
      /\/home/i,
      /\/index/i,
      /\/app/i,
    ],
    title: [
      /^home$/i,
      /welcome/i,
      /get\s+started/i,
      /start\s+building/i,
      /platform/i,
      /the\s+platform/i,
    ],
    body: [
      /hero|banner|cta|call.?to.?action/i,
      /sign\s+up\s+(for\s+)?free/i,
      /start\s+for\s+free/i,
    ],
  },
  LOGIN: {
    url: [
      /\/login/i,
      /\/signin/i,
      /\/signup/i,
      /\/register/i,
      /\/auth/i,
      /\/oauth/i,
      /\/sso/i,
    ],
    title: [
      /^login$/i,
      /^sign\s+in$/i,
      /^sign\s+up$/i,
      /^signup$/i,
      /^register$/i,
      /^log\s+in$/i,
    ],
    body: [
      /email|password|username/i,
      /forgot\s+password/i,
      /remember\s+me/i,
      /don't\s+have\s+an\s+account/i,
    ],
  },
  BLOG: {
    url: [
      /\/blog/i,
      /\/news/i,
      /\/press/i,
      /\/media/i,
      /\/article/i,
      /\/post/i,
      /\/stories/i,
    ],
    title: [
      /blog/i,
      /news/i,
      /press/i,
      /announcement/i,
      /release/i,
    ],
    body: [
      /published\s+on/i,
      /by\s+\w+\s+on/i,
      /read\s+more/i,
      /continue\s+reading/i,
    ],
  },
  HELP: {
    url: [
      /\/help/i,
      /\/support/i,
      /\/faq/i,
      /\/guides/i,
      /\/tutorials/i,
      /\/how.?to/i,
    ],
    title: [
      /^help$/i,
      /^support$/i,
      /^faq/i,
      /^frequently\s+asked/i,
      /^help\s+center$/i,
    ],
    body: [
      /how\s+can\s+we\s+help/i,
      /search\s+help/i,
      /contact\s+support/i,
      /submit\s+a\s+request/i,
    ],
  },
  PRICING: {
    url: [
      /\/pricing/i,
      /\/plans/i,
      /\/billing/i,
      /\/subscription/i,
      /\/upgrade/i,
    ],
    title: [
      /^pricing$/i,
      /^plans$/i,
      /^plans\s+&?\s*pricing/i,
      /^billing$/i,
    ],
    body: [
      /monthly|yearly|annual/i,
      /per\s+month|per\s+year/i,
      /free\s+plan|pro\s+plan|enterprise/i,
      /upgrade\s+to/i,
    ],
  },
  SOCIAL: {
    url: [
      /facebook\.com/i,
      /instagram\.com/i,
      /twitter\.com/i,
      /x\.com/i,
      /linkedin\.com/i,
      /tiktok\.com/i,
      /youtube\.com/i,
      /discord\.com/i,
      /discord\.gg/i,
      /slack\.com/i,
    ],
    title: [],
    body: [],
  },
  ASSET: {
    url: [
      /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|eot|json|xml|pdf|txt|zip)(\?.*)?$/i,
      /\/assets\//i,
      /\/static\//i,
      /\/images\//i,
      /\/img\//i,
      /\/media\//i,
      /\/cdn-cgi\//i,
      /\/_next\//i,
      /\/_nuxt\//i,
    ],
    title: [],
    body: [],
  },
  DOCUMENTATION: {
    url: [
      /\/docs\//i,
      /\/documentation\//i,
      /\/guide\//i,
      /\/guides\//i,
      /\/reference\//i,
      /\/api\//i,
      /\/sdk\//i,
      /\/cli\//i,
      /\/changelog/i,
      /\/roadmap/i,
    ],
    title: [
      /documentation/i,
      /docs/i,
      /guide/i,
      /reference/i,
      /api\s+reference/i,
      /getting\s+started/i,
    ],
    body: [
      /table\s+of\s+contents/i,
      /sidebar/i,
      /previous\s+next/i,
      /edit\s+this\s+page/i,
    ],
  },
  SEARCH: {
    url: [
      /\/search/i,
      /\/explore/i,
      /\/browse/i,
      /\?q=/i,
      /\?query=/i,
      /\?search=/i,
    ],
    title: [
      /^search/i,
      /^search\s+results/i,
      /^results\s+for/i,
    ],
    body: [
      /no\s+results\s+found/i,
      /results\s+for/i,
      /showing\s+\d+\s+results/i,
    ],
  },
  PROFILE: {
    url: [
      /\/user\//i,
      /\/profile\//i,
      /\/u\//i,
      /\/@/i,
      /\/account/i,
      /\/settings/i,
      /\/dashboard/i,
      /\/my.?events/i,
      /\/organized/i,
      /\/hosted/i,
      /\/created/i,
    ],
    title: [
      /^my\s+profile$/i,
      /^profile$/i,
      /^settings$/i,
      /^dashboard$/i,
      /^my\s+events$/i,
      /^my\s+hackathons$/i,
    ],
    body: [
      /edit\s+profile/i,
      /account\s+settings/i,
      /notification\s+settings/i,
    ],
  },
  UNKNOWN: {
    url: [],
    title: [],
    body: [],
  },
};

function scoreClassification($: cheerio.CheerioAPI, url: string, title: string): Record<PageClassification, number> {
  const bodyText = $('body').text().toLowerCase().slice(0, 5000);
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();

  const scores: Record<PageClassification, number> = {
    EVENT: 0,
    CATEGORY: 0,
    NAVIGATION: 0,
    LANDING: 0,
    LOGIN: 0,
    BLOG: 0,
    HELP: 0,
    PRICING: 0,
    SOCIAL: 0,
    ASSET: 0,
    DOCUMENTATION: 0,
    SEARCH: 0,
    PROFILE: 0,
    UNKNOWN: 0,
  };

  for (const [classification, patterns] of Object.entries(classificationPatterns)) {
    let score = 0;

    for (const pattern of patterns.url) {
      if (pattern.test(lowerUrl)) score += 3;
    }
    for (const pattern of patterns.title) {
      if (pattern.test(lowerTitle)) score += 3;
    }
    for (const pattern of patterns.body) {
      if (pattern.test(bodyText)) score += 2;
    }

    scores[classification as PageClassification] = score;
  }

  return scores;
}

export function classifyPage(html: string, url: string): ClassificationResult {
  const $ = cheerio.load(html);
  const pageTitle = $('title').first().text() || $('h1').first().text() || '';
  
  const scores = scoreClassification($, url, pageTitle);
  
  // Find highest scoring classification
  let bestClassification: PageClassification = 'UNKNOWN';
  let bestScore = 0;
  
  for (const [classification, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestClassification = classification as PageClassification;
    }
  }

  // If no strong signals, check if it's an asset
  if (bestScore === 0) {
    if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|eot|json|xml|pdf|txt|zip)(\?.*)?$/i.test(url)) {
      return {
        classification: 'ASSET',
        confidence: 1.0,
        reasons: ['URL has asset file extension'],
      };
    }
    if (/facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|tiktok\.com|youtube\.com|discord\.com|discord\.gg|slack\.com/i.test(url)) {
      return {
        classification: 'SOCIAL',
        confidence: 1.0,
        reasons: ['URL matches social media domain'],
      };
    }
  }

  const reasons: string[] = [];
  const patterns = classificationPatterns[bestClassification];
  if (patterns) {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = pageTitle.toLowerCase();
    const bodyText = $('body').text().toLowerCase().slice(0, 5000);
    
    for (const pattern of patterns.url) {
      if (pattern.test(lowerUrl)) reasons.push(`URL matches ${pattern.source}`);
    }
    for (const pattern of patterns.title) {
      if (pattern.test(lowerTitle)) reasons.push(`Title matches ${pattern.source}`);
    }
    for (const pattern of patterns.body) {
      if (pattern.test(bodyText)) reasons.push(`Body matches ${pattern.source}`);
    }
  }

  // Calculate confidence based on score
  const maxPossibleScore = Math.max(...Object.values(scores));
  const confidence = maxPossibleScore > 0 ? Math.min(bestScore / maxPossibleScore, 1.0) : 0;

  return {
    classification: bestClassification,
    confidence: Math.round(confidence * 100) / 100,
    reasons,
  };
}

export function isEventPage(classification: ClassificationResult): boolean {
  return classification.classification === 'EVENT' && classification.confidence >= 0.3;
}

export function shouldParsePage(classification: ClassificationResult): boolean {
  return isEventPage(classification);
}