import { normalize, type RawHackathon } from '../../pipeline/normalizer';

export interface ValidationIssue {
  sourceId: string;
  reason: string;
}

export class Validator {
  validate(raw: RawHackathon): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!raw.title?.trim()) {
      issues.push({ sourceId: raw.sourceId, reason: 'missing title' });
    }

    if (!raw.sourceUrl?.trim()) {
      issues.push({ sourceId: raw.sourceId, reason: 'missing url' });
    }

    if (!raw.sourceId?.trim()) {
      issues.push({ sourceId: raw.sourceId, reason: 'missing source id' });
    }

    if (raw.sourceUrl && !this.isValidUrl(raw.sourceUrl)) {
      issues.push({ sourceId: raw.sourceId, reason: 'invalid url' });
    }

    if (raw.title && raw.title.length > 300) {
      issues.push({ sourceId: raw.sourceId, reason: 'title too long' });
    }

    normalize(raw);
    return issues;
  }

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
}
