require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const host = client.connectionParameters.host;
    const db = client.connectionParameters.database;
    const res = await client.query("select to_regclass('public.initiative_applications') as reg");
    console.log(JSON.stringify({ host, database: db, exists: res.rows[0].reg !== null }));
    await client.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(2);
  }
})();
