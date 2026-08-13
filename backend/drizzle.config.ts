import { defineConfig } from 'drizzle-kit';

import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be defined before running Drizzle Kit.');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  // migrations are stored in backend/db/migrations
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});