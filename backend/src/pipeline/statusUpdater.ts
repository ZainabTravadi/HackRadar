import { sql } from 'drizzle-orm';

import { db } from '../db';
import { hackathons } from '../db/schema';

// Updates hackathon statuses based on registration and start date windows.
export async function updateStatuses(): Promise<void> {
  await db.execute(sql`
    UPDATE ${hackathons}
    SET status =
      CASE
        WHEN registration_deadline IS NOT NULL AND registration_deadline < NOW()
          THEN 'ended'::status_enum
        WHEN registration_deadline IS NOT NULL AND registration_deadline < NOW() + INTERVAL '3 days'
          THEN 'closing_soon'::status_enum
        WHEN start_date IS NOT NULL AND start_date > NOW()
          THEN 'upcoming'::status_enum
        ELSE 'open'::status_enum
      END
    WHERE status != 'ended'::status_enum
  `);

  console.info('[Status] Updated hackathon statuses');
}