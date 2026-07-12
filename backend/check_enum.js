const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_q1Awuxd8fMQt@ep-restless-cherry-ancgn6mh-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', ssl: { rejectUnauthorized: false } });

pool.query("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'source_enum')")
  .then(r => { console.log(r.rows.map(x => x.enumlabel).join(', ')); pool.end(); })
  .catch(e => { console.error(e); pool.end(); });