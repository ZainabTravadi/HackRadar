import type { NewHackathon } from '../db/schema';

// Applies a deterministic deduplication pass before writes hit the database.
export function deduplicateHackathons(records: NewHackathon[]): NewHackathon[] {
  const seenUrls = new Set<string>();

  return records.filter((record) => {
    if (seenUrls.has(record.sourceUrl)) {
      return false;
    }

    seenUrls.add(record.sourceUrl);
    return true;
  });
}