// Fresh Crawl Runner
// This script runs a complete fresh crawl from scratch

import 'dotenv/config';
import { productionScheduler } from '../crawler/core/productionScheduler';
import { db } from '../db';
import { hackathons, crawlState, discoveryQueue, crawlQueue, retryQueue, deadLetterQueue, crawlerMetrics, scrapeLogs } from '../db/schema';
import { sql } from 'drizzle-orm';

async function runFreshCrawl(): Promise<void> {
  console.info('[FreshCrawl] Starting fresh production crawl...');
  
  // Step 1: Clean database
  console.info('\n[FreshCrawl] Step 1: Cleaning database...');
  await db.delete(hackathons);
  await db.delete(crawlState);
  await db.delete(discoveryQueue);
  await db.delete(crawlQueue);
  await db.delete(retryQueue);
  await db.delete(deadLetterQueue);
  await db.delete(crawlerMetrics);
  await db.delete(scrapeLogs);
  console.info('[FreshCrawl] Database cleaned.');

  // Step 2: Initialize source intervals
  console.info('\n[FreshCrawl] Step 2: Initializing source intervals...');
  const { sourceIntervalService } = await import('../crawler/core/sourceIntervals');
  await sourceIntervalService.initializeDefaults();
  console.info('[FreshCrawl] Source intervals initialized.');

  // Step 3: Run full crawl cycle
  console.info('\n[FreshCrawl] Step 3: Running full crawl cycle...');
  const results = await productionScheduler.runFullCycle();
  
  // Step 4: Print results
  console.info('\n[FreshCrawl] Crawl Results:');
  for (const result of results) {
    console.info(`  ${result.source} (${result.crawlType}):`);
    console.info(`    Items found: ${result.itemsFound}`);
    console.info(`    New items: ${result.itemsNew}`);
    console.info(`    Updated: ${result.itemsUpdated}`);
    console.info(`    Duplicates: ${result.duplicates}`);
    console.info(`    Rejected: ${result.rejected}`);
    console.info(`    Validation failures: ${result.validationFailures}`);
    console.info(`    Success: ${result.success}`);
    if (result.skipped) {
      console.info(`    Skipped: ${result.skipReason}`);
    }
  }

  // Step 5: Verify quality
  console.info('\n[FreshCrawl] Step 4: Verifying data quality...');
  const totalCount = await db.execute(sql`SELECT COUNT(*) as count FROM hackathons;`);
  console.info(`\n[FreshCrawl] Total hackathons in database: ${totalCount.rows[0]?.count ?? 0}`);
  
  const sourceDist = await db.execute(sql`
    SELECT source, COUNT(*) as count 
    FROM hackathons 
    GROUP BY source 
    ORDER BY count DESC
  `);
  console.info('\n[FreshCrawl] Source distribution:');
  console.table(sourceDist.rows);

  // Step 6: Quick quality check
  const quickCheck = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN title ILIKE '%login%' OR title ILIKE '%signup%' OR title ILIKE '%pricing%' OR title ILIKE '%help%' THEN 1 ELSE 0 END) as suspicious_titles,
      SUM(CASE WHEN source_url ILIKE '%.svg%' OR source_url ILIKE '%.png%' OR source_url ILIKE '%.css%' OR source_url ILIKE '%.js%' THEN 1 ELSE 0 END) as asset_urls,
      SUM(CASE WHEN source_url ILIKE '%facebook.com%' OR source_url ILIKE '%instagram.com%' OR source_url ILIKE '%twitter.com%' THEN 1 ELSE 0 END) as social_urls
    FROM hackathons
  `);
  console.info('\n[FreshCrawl] Quick quality check:');
  console.table(quickCheck.rows);

  console.info('\n[FreshCrawl] Fresh crawl completed!');
}

// Run if called directly
runFreshCrawl()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[FreshCrawl] Error:', err);
    process.exit(1);
  });