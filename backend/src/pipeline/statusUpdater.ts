import { sql } from 'drizzle-orm';

import { db } from '../db';
import { hackathons } from '../db/schema';

// Robust status update using multiple date signals: endDate, registrationDeadline, startDate.
export async function updateStatuses(): Promise<void> {
  await db.execute(sql`
    UPDATE ${hackathons}
    SET status =
      CASE
        -- If event has ended (end date in past) => ended
        WHEN end_date IS NOT NULL AND end_date < NOW() THEN 'ended'::status_enum

        -- If submission deadline in past and there is no end date yet, mark ended
        WHEN submission_deadline IS NOT NULL AND submission_deadline < NOW() THEN 'ended'::status_enum

        -- Closing soon: registration deadline within 3 days and in the future
        WHEN registration_deadline IS NOT NULL AND registration_deadline >= NOW() AND registration_deadline <= NOW() + INTERVAL '3 days' THEN 'closing_soon'::status_enum

        -- Upcoming: start date is in the future
        WHEN start_date IS NOT NULL AND start_date > NOW() THEN 'upcoming'::status_enum

        -- Open: fallback when event is ongoing or registration is open
        ELSE 'open'::status_enum
      END
    -- Only update rows where computed status differs from the stored status
    WHERE (
      CASE
        WHEN end_date IS NOT NULL AND end_date < NOW() THEN 'ended'::status_enum
        WHEN submission_deadline IS NOT NULL AND submission_deadline < NOW() THEN 'ended'::status_enum
        WHEN registration_deadline IS NOT NULL AND registration_deadline >= NOW() AND registration_deadline <= NOW() + INTERVAL '3 days' THEN 'closing_soon'::status_enum
        WHEN start_date IS NOT NULL AND start_date > NOW() THEN 'upcoming'::status_enum
        ELSE 'open'::status_enum
      END
    ) != status
  `);

  console.info('[Status] Updated hackathon statuses (multi-signal)');
}