import 'dotenv/config';

import './server';
import { createDefaultScheduler } from './crawler/core/scheduler';
import { validateData } from './debug/validateData';
import { updateStatuses } from './pipeline/statusUpdater';

// Application entry point for the reusable crawler framework.
async function main(): Promise<void> {
  console.info('HackRadar backend starting...');

  if (process.env.RUN_STARTUP_TASKS !== 'true') {
    console.info('Startup crawler tasks are disabled. Set RUN_STARTUP_TASKS=true to run the one-off bootstrap cycle.');
    return;
  }

  try {
    const scheduler = createDefaultScheduler();
    await scheduler.runAll();
    await updateStatuses();
    await validateData();
    console.info('Crawler run complete.');
  } catch (error: unknown) {
    console.error('[Bootstrap] Non-fatal startup task failed:', error);
  }
}

void main();
