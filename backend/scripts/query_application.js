require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

(async () => {
  const id = process.argv[2];
  if (!id) { console.error('Usage: node query_application.js <applicationId>'); process.exit(2); }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM initiative_applications WHERE id = $1', [id]);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(3);
  }
})();
