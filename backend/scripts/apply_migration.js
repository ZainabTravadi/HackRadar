require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async () => {
  const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '0001_create_initiative_applications.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(2);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const host = client.connectionParameters.host;
    const db = client.connectionParameters.database;
    console.log(JSON.stringify({ host, database: db, action: 'applying_migration' }));

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('Migration applied successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration failed:', err.message || err);
    process.exit(3);
  }
})();
