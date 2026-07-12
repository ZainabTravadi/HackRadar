import { eq } from 'drizzle-orm';

import { db } from '../../db';
import { hackathons } from '../../db/schema';

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'msclkid', 'ttclid', 'li_fat_id',
  'ref', 'source', 'campaign', 'medium', 'term', 'content',
  '_ga', '_gl', 'mc_cid', 'mc_eid', 'hsCtaTracking',
  'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
  'affiliate', 'partner', 'referral', 'promo', 'discount',
];

export class Deduplicator {
  async isDuplicate(source: string, sourceId: string, sourceUrl: string): Promise<boolean> {
    const existing = await db
      .select({
        id: hackathons.id,
        title: hackathons.title,
        sourceUrl: hackathons.sourceUrl,
        organizerName: hackathons.organizerName,
        location: hackathons.location,
        startDate: hackathons.startDate,
        endDate: hackathons.endDate,
        registrationDeadline: hackathons.registrationDeadline,
      })
      .from(hackathons)
      .where(eq(hackathons.source, source as never))
      .limit(200);

    const candidateTitle = this.normalizeText(sourceId || sourceUrl || '');
    const candidateUrl = this.normalizeUrl(sourceUrl || '');

    return existing.some((row) => {
      const rowTitle = this.normalizeText(row.title ?? '');
      const rowUrl = this.normalizeUrl(row.sourceUrl ?? '');
      const rowOrganizer = this.normalizeText(row.organizerName ?? '');
      const rowLocation = this.normalizeText(row.location ?? '');

      const sameTitle = Boolean(candidateTitle && rowTitle && candidateTitle === rowTitle);
      const sameUrl = Boolean(candidateUrl && rowUrl && candidateUrl === rowUrl);
      const sameOrganizer = Boolean(rowOrganizer && this.normalizeText(sourceId || '') && rowOrganizer === this.normalizeText(sourceId || ''));
      const sameLocation = Boolean(rowLocation && this.normalizeText(sourceUrl || '') && rowLocation === this.normalizeText(sourceUrl || ''));
      const sameDates = this.sameDate(row.startDate, row.endDate, row.registrationDeadline);

      // Count matching signals and require at least two to mark as duplicate
      let matches = 0;
      if (sameUrl) matches += 2; // strong signal
      if (sameTitle) matches += 2; // strong signal
      if (sameOrganizer) matches += 1;
      if (sameLocation) matches += 1;
      if (sameDates) matches += 1;

      return matches >= 2;
    });
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
  }

  private normalizeUrl(value: string): string {
    try {
      const parsed = new URL(value);
      // Remove tracking parameters
      const params = new URLSearchParams(parsed.search);
      for (const param of TRACKING_PARAMS) {
        params.delete(param);
      }
      parsed.search = params.toString();
      // Remove fragment
      parsed.hash = '';
      // Normalize hostname (remove www)
      let hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
      // Normalize path (remove trailing slash unless it's the root)
      let pathname = parsed.pathname.toLowerCase();
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      parsed.pathname = pathname;
      return `${hostname}${pathname}${parsed.search ? '?' + parsed.search : ''}`;
    } catch {
      return value.toLowerCase();
    }
  }

  private sameDate(startDate: Date | null, endDate: Date | null, registrationDeadline: Date | null): boolean {
    const candidates = [startDate, endDate, registrationDeadline].filter(Boolean) as Date[];
    return candidates.length > 0;
  }
}