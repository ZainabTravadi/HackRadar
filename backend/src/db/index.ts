import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

type DatabaseInstance = ReturnType<typeof drizzle>;

let pool: Pool | null = null;
let dbInstance: DatabaseInstance | null = null;

function createDatabase(): DatabaseInstance {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to initialize the PostgreSQL connection.');
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  dbInstance = drizzle(pool, { schema });
  console.info('PostgreSQL pool initialized for Neon with SSL enabled.');
  return dbInstance;
}

export function getDatabase(): DatabaseInstance {
  return createDatabase();
}

export function getPool(): Pool {
  createDatabase();

  if (!pool) {
    throw new Error('PostgreSQL pool failed to initialize.');
  }

  return pool;
}

const dbProxy = new Proxy({} as DatabaseInstance, {
  get(_target, property, receiver) {
    const database = createDatabase();
    const value = Reflect.get(database as object, property, receiver);
    return typeof value === 'function' ? value.bind(database) : value;
  },
  set(_target, property, value, receiver) {
    const database = createDatabase();
    return Reflect.set(database as object, property, value, receiver);
  },
  has(_target, property) {
    const database = createDatabase();
    return property in database;
  },
  ownKeys() {
    const database = createDatabase();
    return Reflect.ownKeys(database as object);
  },
  getOwnPropertyDescriptor(_target, property) {
    const database = createDatabase();
    return Object.getOwnPropertyDescriptor(database as object, property);
  },
}) as DatabaseInstance;

export const db = dbProxy;

export type Database = DatabaseInstance;
