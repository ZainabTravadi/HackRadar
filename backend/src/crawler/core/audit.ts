export interface AdapterAuditRow {
  source: string;
  listing: string;
  pagination: string;
  detail: string;
  normalize: string;
  validate: string;
  dedupe: string;
  persistence: string;
  rawStorage: string;
  status: string;
}

export function createAdapterAuditReport(rows: AdapterAuditRow[]): string {
  const lines = ['| Source | Listing | Pagination | Detail | Normalize | Validate | Dedupe | Persist | Raw Storage | Status |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const row of rows) {
    lines.push(`| ${row.source} | ${row.listing} | ${row.pagination} | ${row.detail} | ${row.normalize} | ${row.validate} | ${row.dedupe} | ${row.persistence} | ${row.rawStorage} | ${row.status} |`);
  }
  return lines.join('\n');
}
