import dotenv from 'dotenv';

// Loads environment variables once for the backend runtime and Drizzle tooling.
dotenv.config();

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required but was not provided.`);
  }

  return value;
}