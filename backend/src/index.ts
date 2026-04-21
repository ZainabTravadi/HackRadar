import 'dotenv/config';

import { validateData } from './debug/validateData';
import { updateStatuses } from './pipeline/statusUpdater';
import { scrapeDevpost } from './scrapers/devpost';

// Application entry point for one-off scrape execution.
async function main(): Promise<void> {
  try {
    console.info('HackRadar backend starting...');
    await scrapeDevpost();
    await updateStatuses();
    await validateData();
    console.info('Initial scrape complete.');
    process.exit(0);
  } catch (error: unknown) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

void main();