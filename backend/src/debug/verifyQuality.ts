#!/usr/bin/env node
// Data Quality Verification Script
// Run this after a fresh crawl to verify the database contains only real hackathons

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { hackathons } from '../db/schema';

const BLOCKED_TITLE_TERMS = [
  'login', 'logout', 'sign up', 'signup', 'sign in', 'signin', 'home', 'pricing', 'help center',
  'community', 'contact', 'support', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok',
  'documentation', 'blog', 'news', 'resources', 'about', 'privacy', 'terms', 'cookie', 'legal',
  'careers', 'jobs', 'hiring', 'press', 'media', 'brand', 'assets', 'developers', 'api', 'status',
  'security', 'compliance', 'sitemap', 'accessibility', 'find tickets', 'event ticketing', 'qr codes',
  'discover', 'explore', 'organize', 'create event', 'manage events', 'my events', 'past events',
  'upcoming events', 'browse', 'search', 'categories', 'cities', 'countries', 'online', 'virtual',
  'in person', 'all events', 'see all', 'view all', 'load more', 'show more', 'register', 'join',
  'get app', 'download', 'contact sales', 'enterprise', 'solutions', 'features', 'integrations',
  'marketplace', 'partners', 'affiliates', 'referral', 'invite', 'settings', 'profile', 'account',
  'dashboard', 'notifications', 'messages', 'inbox', 'saved', 'bookmarks', 'history', 'activity',
  'following', 'followers', 'groups', 'communities', 'spaces', 'servers', 'channels', 'topics',
  'trending', 'popular', 'recommended', 'for you', 'personalized',
];

const BLOCKED_EXTENSIONS = [
  '.svg', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.css', '.js', '.pdf', '.xml',
];

const NAVIGATION_PATTERNS = [
  'all hackathons', 'upcoming hackathons', 'past hackathons', 'hackathon directory',
  'all events', 'upcoming events', 'past events', 'event directory', 'event list',
  'all challenges', 'competitive challenges', 'hiring challenges', 'university challenges',
  'discover events', 'explore events', 'community events', 'creator profiles',
];

export async function verifyDataQuality(): Promise<void> {
  console.info('\n[Verification] Starting data quality checks...\n');

  // 1. Check for invalid titles
  const invalidTitles = await db.execute(sql`
    SELECT id, title, source, source_url
    FROM hackathons
    WHERE 
      title IS NULL 
      OR title = ''
      OR LENGTH(TRIM(title)) < 5
      OR LOWER(title) IN ('hackathon', 'event', 'challenge', 'hackathons', 'events', 'challenges',
        'hackathon event', 'new event', 'learn more', 'view details', 'read more',
        'see details', 'click here', 'more info', 'details', 'event details',
        'upcoming', 'latest', 'recent', 'popular', 'trending', 'featured')
  `);
  console.info(`❌ Invalid titles found: ${invalidTitles.rows.length}`);
  if (invalidTitles.rows.length > 0) {
    console.table(invalidTitles.rows.slice(0, 10));
  }

  // 2. Check for blocked title terms
  let blockedTitleCount = 0;
  for (const term of BLOCKED_TITLE_TERMS) {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM hackathons 
      WHERE LOWER(title) = ${term} OR LOWER(title) LIKE ${'%' + term + '%'}
    `);
    blockedTitleCount += Number(result.rows[0]?.count || 0);
  }
  console.info(`❌ Records with blocked title terms: ${blockedTitleCount}`);

  // 3. Check for blocked extensions in URLs
  let blockedExtCount = 0;
  for (const ext of BLOCKED_EXTENSIONS) {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM hackathons 
      WHERE LOWER(source_url) LIKE ${'%' + ext + '%'}
    `);
    blockedExtCount += Number(result.rows[0]?.count || 0);
  }
  console.info(`❌ Records with blocked file extensions: ${blockedExtCount}`);

  // 4. Check for navigation/category pages
  let navPageCount = 0;
  for (const pattern of NAVIGATION_PATTERNS) {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM hackathons 
      WHERE LOWER(title) LIKE ${'%' + pattern + '%'} 
         OR LOWER(source_url) LIKE ${'%' + pattern + '%'}
    `);
    navPageCount += Number(result.rows[0]?.count || 0);
  }
  console.info(`❌ Navigation/category pages: ${navPageCount}`);

  // 5. Check for social media URLs
  const socialCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM hackathons 
    WHERE source_url LIKE '%facebook.com%' 
       OR source_url LIKE '%instagram.com%' 
       OR source_url LIKE '%twitter.com%' 
       OR source_url LIKE '%tiktok.com%' 
       OR source_url LIKE '%linkedin.com%' 
       OR source_url LIKE '%youtube.com%'
       OR source_url LIKE '%discord.com%' 
       OR source_url LIKE '%discord.gg%'
  `);
  console.info(`❌ Social media URLs: ${socialCount.rows[0]?.count || 0}`);

  // 6. Check for asset URLs
  const assetCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM hackathons 
    WHERE source_url LIKE '%/assets/%' 
       OR source_url LIKE '%/static/%' 
       OR source_url LIKE '%/images/%' 
       OR source_url LIKE '%/img/%' 
       OR source_url LIKE '%/media/%'
  `);
  console.info(`❌ Asset URLs: ${assetCount.rows[0]?.count || 0}`);

  // 7. Check for pricing/help/blog pages
  const marketingCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM hackathons 
    WHERE source_url LIKE '%/pricing%' 
       OR source_url LIKE '%/help%' 
       OR source_url LIKE '%/support%' 
       OR source_url LIKE '%/blog%' 
       OR source_url LIKE '%/about%' 
       OR source_url LIKE '%/careers%' 
       OR source_url LIKE '%/contact%' 
       OR source_url LIKE '%/privacy%' 
       OR source_url LIKE '%/terms%' 
       OR source_url LIKE '%/login%' 
       OR source_url LIKE '%/signup%' 
       OR source_url LIKE '%/register%'
  `);
  console.info(`❌ Marketing/support pages: ${marketingCount.rows[0]?.count || 0}`);

  // 8. Check for malformed dates
  const badDates = await db.execute(sql`
    SELECT COUNT(*) as count FROM hackathons 
    WHERE (registration_deadline IS NOT NULL AND (EXTRACT(YEAR FROM registration_deadline) < 2020 OR EXTRACT(YEAR FROM registration_deadline) > 2035))
       OR (submission_deadline IS NOT NULL AND (EXTRACT(YEAR FROM submission_deadline) < 2020 OR EXTRACT(YEAR FROM submission_deadline) > 2035))
       OR (start_date IS NOT NULL AND (EXTRACT(YEAR FROM start_date) < 2020 OR EXTRACT(YEAR FROM start_date) > 2035))
       OR (end_date IS NOT NULL AND (EXTRACT(YEAR FROM end_date) < 2020 OR EXTRACT(YEAR FROM end_date) > 2035))
  `);
  console.info(`❌ Malformed dates: ${badDates.rows[0]?.count || 0}`);

  // 9. Check missing evidence
  const missingEvidence = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN title IS NULL OR title = '' THEN 1 ELSE 0 END) as missing_title,
      SUM(CASE WHEN description IS NULL OR description = '' THEN 1 ELSE 0 END) as missing_desc,
      SUM(CASE WHEN organizer_name IS NULL OR organizer_name = '' THEN 1 ELSE 0 END) as missing_organizer,
      SUM(CASE WHEN registration_deadline IS NULL AND submission_deadline IS NULL AND start_date IS NULL AND end_date IS NULL THEN 1 ELSE 0 END) as missing_dates,
      SUM(CASE WHEN location IS NULL OR location = '' THEN 1 ELSE 0 END) as missing_location,
      SUM(CASE WHEN prize_description IS NULL OR prize_description = '' THEN 1 ELSE 0 END) as missing_prize
    FROM hackathons
  `);
  console.info('\n📊 Missing evidence fields:');
  console.table(missingEvidence.rows);

  // 10. Total count and source distribution
  const totalCount = await db.execute(sql`SELECT COUNT(*) as count FROM hackathons`);
  const sourceDist = await db.execute(sql`
    SELECT source, COUNT(*) as count 
    FROM hackathons 
    GROUP BY source 
    ORDER BY count DESC
  `);
  
  console.info(`\n📈 Total records: ${totalCount.rows[0]?.count || 0}`);
  console.info('\n📊 Source distribution:');
  console.table(sourceDist.rows);

  // 11. Evidence score distribution (if we can compute it)
  console.info('\n✅ Verification complete.');
  
  // Summary
  const totalIssues = invalidTitles.rows.length + blockedTitleCount + blockedExtCount + navPageCount + 
    Number(socialCount.rows[0]?.count || 0) + Number(assetCount.rows[0]?.count || 0) + 
    Number(marketingCount.rows[0]?.count || 0) + Number(badDates.rows[0]?.count || 0);
  
  console.info(`\n🎯 SUMMARY: ${totalIssues} total issues found`);
  
  if (totalIssues === 0) {
    console.info('🎉 ALL CHECKS PASSED - Database contains only real hackathons!');
  } else {
    console.info('⚠️  ISSUES FOUND - Database needs cleaning');
    process.exit(1);
  }
}

// Run if called directly
verifyDataQuality()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });