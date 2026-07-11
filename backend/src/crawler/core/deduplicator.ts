import { and, eq, ilike } from 'drizzle-orm';

import { db } from '../../db';
import { hackathons } from '../../db/schema';

export class Deduplicator {
  async isDuplicate(source: string, sourceId: string, sourceUrl: string): Promise<boolean> {
    const existing = await db
      .select({ id: hackathons.id, title: hackathons.title, sourceUrl: hackathons.sourceUrl, organizerName: hackathons.organizerName })
      .from(hackathons)
      .where(and(eq(hackathons.source, source as never), eq(hackathons.sourceId, sourceId)))
      .limit(5);

    if (existing.length > 0) {
      return true;
    }

    const byUrl = await db.select({ id: hackathons.id }).from(hackathons).where(eq(hackathons.sourceUrl, sourceUrl)).limit(1);
    if (byUrl.length > 0) {
      return true;
    }

    const domain = this.getDomain(sourceUrl);
    const domainMatches = await db.select({ id: hackathons.id }).from(hackathons).where(ilike(hackathons.sourceUrl, `%${domain}%`)).limit(5);

    if (domainMatches.length > 0) {
      return true;
    }

    return false;
  }

  private getDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }
}
