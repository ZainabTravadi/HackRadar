require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'initiative_applications'
      ORDER BY ordinal_position;
    `);

    const idx = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'initiative_applications';
    `);

    console.log(JSON.stringify({ columns: cols.rows, indexes: idx.rows }, null, 2));
    await client.end();
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(2);
  }
})();
