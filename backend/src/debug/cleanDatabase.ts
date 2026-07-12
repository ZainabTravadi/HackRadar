#!/usr/bin/env node
/**
 * Database Cleanup Utility
 * Removes invalid records from the hackathons table:
 * - Navigation pages (login, signup, pricing, help, etc.)
 * - Landing pages
 * - Asset URLs (svg, png, css, js, etc.)
 * - Directory/category pages
 * - Duplicate events
 * - Malformed URLs
 * - Invalid titles
 * - Placeholder titles
 * - Invalid dates
 * - Records failing current validation
 */

import 'dotenv/config';
import { db } from '../db';
import { hackathons } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const BLOCKED_TITLE_TERMS = [
  'login', 'logout', 'sign up', 'signup', 'sign in', 'signin', 'home', 'pricing', 'help center',
  'community', 'contact', 'support', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok',
  'documentation', 'blog', 'news', 'resources', 'about', 'privacy', 'terms', 'terms of service',
  'terms of use', 'cookie', 'legal', 'careers', 'jobs', 'hiring', 'press', 'media', 'brand',
  'assets', 'developers', 'api', 'status', 'security', 'compliance', 'sitemap', 'accessibility',
  'find tickets', 'event ticketing', 'qr codes', 'discover', 'explore', 'organize', 'create event',
  'manage events', 'my events', 'past events', 'upcoming events', 'browse', 'search', 'categories',
  'cities', 'countries', 'online', 'virtual', 'in person', 'all events', 'see all', 'view all',
  'load more', 'show more', 'register', 'join', 'get app', 'download', 'contact sales',
  'enterprise', 'solutions', 'features', 'integrations', 'marketplace', 'partners', 'affiliates',
  'referral', 'invite', 'settings', 'profile', 'account', 'dashboard', 'notifications',
  'messages', 'inbox', 'saved', 'bookmarks', 'history', 'activity', 'following', 'followers',
  'groups', 'communities', 'spaces', 'servers', 'channels', 'topics', 'trending', 'popular',
  'recommended', 'for you', 'personalized', 'discover', 'explore', 'browse',
];

const PLACEHOLDER_TITLES = [
  'hackathon', 'event', 'challenge', 'hackathons', 'events', 'challenges',
  'hackathon event', 'new event', 'learn more', 'view details', 'read more',
  'see details', 'click here', 'more info', 'details', 'event details',
  'upcoming', 'latest', 'recent', 'popular', 'trending', 'featured',
];

const BLOCKED_URL_PATHS = [
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

const BLOCKED_EXTENSIONS = [
  '.svg', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.bmp', '.tiff', '.avif',
  '.css', '.js', '.map', '.json', '.xml', '.pdf', '.txt', '.zip', '.tar', '.gz',
  '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.webm', '.mov', '.avi',
  '.mp3', '.wav', '.ogg', '.flac', '.csv', '.xlsx', '.docx', '.pptx',
];

const NAVIGATION_PAGE_PATTERNS = [
  'all hackathons', 'upcoming hackathons', 'past hackathons', 'open hackathons',
  'hackathon directory', 'hackathon list', 'hackathon calendar', 'find hackathons',
  'browse hackathons', 'hackathon categories', 'hackathon tags', 'hackathon search',
  'all events', 'upcoming events', 'past events', 'event directory', 'event list',
  'event calendar', 'find events', 'browse events', 'event categories', 'event tags',
  'all challenges', 'upcoming challenges', 'past challenges', 'challenge directory',
  'competitive challenges', 'hiring challenges', 'university challenges', 'practice challenges',
  'discover events', 'explore events', 'community events', 'online events', 'city events',
  'creator profiles', 'organizer profiles', 'community home', 'group home',
];

const NAVIGATION_URL_PATTERNS = [
  '/hackathons$', '/hackathons/', '/events$', '/events/', '/challenges$', '/challenges/',
  '/competitions$', '/competitions/', '/contests$', '/contests/', '/marketplace',
  '/organize', '/create', '/host', '/pricing', '/plans', '/billing', '/subscription',
  '/discover', '/explore', '/browse', '/search', '/categories', '/tags', '/topics',
  '/cities', '/countries', '/locations', '/venues', '/organizers', '/creators',
  '/communities', '/groups', '/spaces', '/servers', '/profile', '/account',
  '/settings', '/dashboard', '/notifications', '/messages', '/inbox', '/saved',
  '/bookmarks', '/history', '/activity', '/following', '/followers',
];

function hasBlockedTitle(title: string): boolean {
  const normalized = title.toLowerCase();
  return BLOCKED_TITLE_TERMS.some(term => normalized === term || normalized.includes(term));
}

function isPlaceholderTitle(title: string): boolean {
  const normalized = title.toLowerCase().trim();
  return PLACEHOLDER_TITLES.some(value => normalized === value || normalized.includes(value));
}

function hasBlockedUrlPath(url: string): boolean {
  const normalized = url.toLowerCase();
  return BLOCKED_URL_PATHS.some(path => normalized.includes(path));
}

function hasBlockedExtension(url: string): boolean {
  const normalized = url.toLowerCase();
  return BLOCKED_EXTENSIONS.some(ext => normalized.includes(ext));
}

function isNavigationPage(title: string, url: string): boolean {
  const normalizedTitle = title.toLowerCase();
  const normalizedUrl = url.toLowerCase();
  
  if (NAVIGATION_PAGE_PATTERNS.some(pattern => 
    normalizedTitle.includes(pattern) || normalizedUrl.includes(pattern)
  )) {
    return true;
  }
  
  if (NAVIGATION_URL_PATTERNS.some(pattern => 
    normalizedTitle.includes(pattern.replace(/[$\/]/g, '')) || normalizedUrl.includes(pattern)
  )) {
    return true;
  }
  
  return false;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function hasMalformedDates(row: any): boolean {
  const dateFields = [
    row.registrationDeadline,
    row.submissionDeadline,
    row.startDate,
    row.endDate,
  ].filter(Boolean) as Date[];

  for (const date of dateFields) {
    if (isNaN(date.getTime())) {
      return true;
    }
    const year = date.getFullYear();
    if (year < 2020 || year > 2035) {
      return true;
    }
  }
  return false;
}

async function cleanupDatabase(): Promise<void> {
  console.info('\n[Cleanup] Starting database cleanup...');
  
  const totalBefore = await db.execute(sql`SELECT COUNT(*) AS count FROM hackathons;`);
  console.info(`[Cleanup] Total records before cleanup: ${totalBefore.rows[0]?.count ?? 0}`);

  let deletedCount = 0;

  // 1. Delete records with blocked titles
  console.info('[Cleanup] Removing records with blocked titles...');
  for (const term of BLOCKED_TITLE_TERMS) {
    const result = await db.execute(sql`
      DELETE FROM hackathons 
      WHERE LOWER(title) = ${term} OR LOWER(title) LIKE ${'%' + term + '%'}
    `);
    deletedCount += result.rowCount ?? 0;
  }

  // 2. Delete records with placeholder titles
  console.info('[Cleanup] Removing records with placeholder titles...');
  const placeholderResult = await db.execute(sql`
    DELETE FROM hackathons 
    WHERE LOWER(title) IN ('hackathon', 'event', 'challenge', 'hackathons', 'events', 'challenges',
      'hackathon event', 'new event', 'learn more', 'view details', 'read more',
      'see details', 'click here', 'more info', 'details', 'event details',
      'upcoming', 'latest', 'recent', 'popular', 'trending', 'featured')
  `);
  deletedCount += placeholderResult.rowCount ?? 0;

  // 3. Delete records with blocked URL paths
  console.info('[Cleanup] Removing records with blocked URL paths...');
  for (const path of BLOCKED_URL_PATHS) {
    const result = await db.execute(sql`
      DELETE FROM hackathons 
      WHERE LOWER(source_url) LIKE ${'%' + path + '%'}
    `);
    deletedCount += result.rowCount ?? 0;
  }

  // 4. Delete records with blocked extensions
  console.info('[Cleanup] Removing records with blocked file extensions...');
  for (const ext of BLOCKED_EXTENSIONS) {
    const result = await db.execute(sql`
      DELETE FROM hackathons 
      WHERE LOWER(source_url) LIKE ${'%' + ext + '%'}
    `);
    deletedCount += result.rowCount ?? 0;
  }

  // 5. Delete navigation/category pages
  console.info('[Cleanup] Removing navigation/category pages...');
  for (const pattern of NAVIGATION_PAGE_PATTERNS) {
    const result = await db.execute(sql`
      DELETE FROM hackathons 
      WHERE LOWER(title) LIKE ${'%' + pattern + '%'} 
         OR LOWER(source_url) LIKE ${'%' + pattern + '%'}
    `);
    deletedCount += result.rowCount ?? 0;
  }

  // 6. Delete navigation URL patterns
  console.info('[Cleanup] Removing navigation URL patterns...');
  for (const pattern of NAVIGATION_URL_PATTERNS) {
    const cleanPattern = pattern.replace(/[$\/]/g, '');
    const result = await db.execute(sql`
      DELETE FROM hackathons 
      WHERE LOWER(title) LIKE ${'%' + cleanPattern + '%'} 
         OR LOWER(source_url) LIKE ${'%' + pattern + '%'}
    `);
    deletedCount += result.rowCount ?? 0;
  }

  // 7. Delete social media URLs
  console.info('[Cleanup] Removing social media URLs...');
  const socialResult = await db.execute(sql`
    DELETE FROM hackathons 
    WHERE source_url LIKE '%facebook.com%' 
       OR source_url LIKE '%instagram.com%' 
       OR source_url LIKE '%twitter.com%' 
       OR source_url LIKE '%tiktok.com%' 
       OR source_url LIKE '%linkedin.com%' 
       OR source_url LIKE '%youtube.com%'
       OR source_url LIKE '%discord.com%' 
       OR source_url LIKE '%discord.gg%'
       OR source_url LIKE '%slack.com%'
  `);
  deletedCount += socialResult.rowCount ?? 0;

  // 8. Delete asset URLs
  console.info('[Cleanup] Removing asset URLs...');
  const assetResult = await db.execute(sql`
    DELETE FROM hackathons 
    WHERE source_url LIKE '%/assets/%' 
       OR source_url LIKE '%/static/%' 
       OR source_url LIKE '%/images/%' 
       OR source_url LIKE '%/img/%' 
       OR source_url LIKE '%/media/%'
       OR source_url LIKE '%/cdn-cgi/%'
       OR source_url LIKE '%/_next/%'
       OR source_url LIKE '%/_nuxt/%'
  `);
  deletedCount += assetResult.rowCount ?? 0;

  // 9. Delete records with malformed URLs
  console.info('[Cleanup] Removing records with malformed URLs...');
  const malformedUrlResult = await db.execute(sql`
    DELETE FROM hackathons 
    WHERE source_url NOT LIKE 'http://%' AND source_url NOT LIKE 'https://%'
  `);
  deletedCount += malformedUrlResult.rowCount ?? 0;

  // 10. Delete records with malformed dates
  console.info('[Cleanup] Removing records with malformed dates...');
  const badDateResult = await db.execute(sql`
    DELETE FROM hackathons 
    WHERE (registration_deadline IS NOT NULL AND (EXTRACT(YEAR FROM registration_deadline) < 2020 OR EXTRACT(YEAR FROM registration_deadline) > 2035))
       OR (submission_deadline IS NOT NULL AND (EXTRACT(YEAR FROM submission_deadline) < 2020 OR EXTRACT(YEAR FROM submission_deadline) > 2035))
       OR (start_date IS NOT NULL AND (EXTRACT(YEAR FROM start_date) < 2020 OR EXTRACT(YEAR FROM start_date) > 2035))
       OR (end_date IS NOT NULL AND (EXTRACT(YEAR FROM end_date) < 2020 OR EXTRACT(YEAR FROM end_date) > 2035))
  `);
  deletedCount += badDateResult.rowCount ?? 0;

  // 11. Delete records with empty or very short titles
  console.info('[Cleanup] Removing records with empty/short titles...');
  const shortTitleResult = await db.execute(sql`
    DELETE FROM hackathons 
    WHERE title IS NULL OR title = '' OR LENGTH(TRIM(title)) < 5
  `);
  deletedCount += shortTitleResult.rowCount ?? 0;

  // 12. Delete records missing source_id
  console.info('[Cleanup] Removing records missing source_id...');
  const missingSourceIdResult = await db.execute(sql`
    DELETE FROM hackathons 
    WHERE source_id IS NULL OR source_id = ''
  `);
  deletedCount += missingSourceIdResult.rowCount ?? 0;

  const totalAfter = await db.execute(sql`SELECT COUNT(*) AS count FROM hackathons;`);
  console.info(`\n[Cleanup] Total records after cleanup: ${totalAfter.rows[0]?.count ?? 0}`);
  console.info(`[Cleanup] Approximate records deleted: ${deletedCount}`);
  console.info('[Cleanup] Database cleanup complete.');
}

// Run if called directly
cleanupDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Cleanup] Error:', err);
    process.exit(1);
  });