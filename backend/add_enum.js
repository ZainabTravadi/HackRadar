const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_q1Awuxd8fMQt@ep-restless-cherry-ancgn6mh-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', ssl: { rejectUnauthorized: false } });

const missing = ['github', 'reddit', 'discord', 'telegram', 'linkedin', 'twitter', 'facebook', 'google'];

async function addEnums() {
  for (const val of missing) {
    try {
      await pool.query("ALTER TYPE source_enum ADD VALUE '" + val + "'");
      console.log('Added enum:', val);
    } catch (e) {
      console.log('Skip:', val, e.message);
    }
  }
  await pool.end();
}

addEnums().catch(e => { console.error(e); pool.end(); });