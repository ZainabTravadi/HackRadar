import { sql } from 'drizzle-orm';

import { db } from '../db';
import { hackathons } from '../db/schema';

// Recompute status from the live date fields instead of trusting stored values.
export async function updateStatuses(): Promise<void> {
  await db.execute(sql`
    UPDATE ${hackathons}
    SET status =
      CASE
        WHEN COALESCE(registration_deadline, submission_deadline, end_date, start_date) IS NULL THEN 'upcoming'::status_enum
        WHEN COALESCE(registration_deadline, submission_deadline, end_date, start_date) < NOW() THEN 'ended'::status_enum
        WHEN COALESCE(registration_deadline, submission_deadline, end_date, start_date) <= NOW() + INTERVAL '3 days' THEN 'closing_soon'::status_enum
        WHEN registration_deadline IS NULL AND submission_deadline IS NULL AND end_date IS NULL AND start_date IS NOT NULL AND start_date > NOW() THEN 'upcoming'::status_enum
        ELSE 'open'::status_enum
      END
    WHERE (
      CASE
        WHEN COALESCE(registration_deadline, submission_deadline, end_date, start_date) IS NULL THEN 'upcoming'::status_enum
        WHEN COALESCE(registration_deadline, submission_deadline, end_date, start_date) < NOW() THEN 'ended'::status_enum
        WHEN COALESCE(registration_deadline, submission_deadline, end_date, start_date) <= NOW() + INTERVAL '3 days' THEN 'closing_soon'::status_enum
        WHEN registration_deadline IS NULL AND submission_deadline IS NULL AND end_date IS NULL AND start_date IS NOT NULL AND start_date > NOW() THEN 'upcoming'::status_enum
        ELSE 'open'::status_enum
      END
    ) != status
  `);

  console.info('[Status] Updated hackathon statuses from current deadlines');
}
