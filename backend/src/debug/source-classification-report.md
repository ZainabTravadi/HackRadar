# Source Classification Report

This report reclassifies each source according to its intended role in the HackRadar ecosystem.

**Note (added for Issue #25):** this report describes intended source roles (PRIMARY, AGGREGATOR, DISCOVERY), which drive scheduler behavior. It is not proof of runtime readiness. The 'Intended Status' column names the configured role; it does not claim the feed was verified as active. For observed runtime results, see `production-hardening-report.md`, where Devpost is the only source marked PASS in the recorded snapshot. The probe date of that snapshot is unknown, so the PASS mark describes that recording, not the current state.

| Source | Classification | Intended Status (configured role, not verified operation) | Capabilities | Pagination | Detail Pages | Metadata Quality | Legal Limitations | Intended Production Readiness (not verified) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Devpost | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Recorded snapshot PASS only (probe date unknown; not current proof) |
| MLH | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| Devfolio | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| Unstop | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| DoraHacks | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| TAIKAI | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| HackerEarth | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| Hack2Skill | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| Reskilll | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| ETHGlobal | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| lablab.ai | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| AngelHack | PRIMARY | Intended: active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Intended only (recorded snapshot: LIMITED or FAIL; unverified) |
| Eventbrite | AGGREGATOR | Intended: public event discovery | Discover events and capture core metadata | Yes | No | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| Meetup | AGGREGATOR | Intended: public event discovery | Discover events and capture core metadata | Yes | No | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| Luma | AGGREGATOR | Intended: public event discovery | Discover events and capture core metadata | Yes | No | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| Hack Club | AGGREGATOR | Intended: public event discovery | Discover events and capture core metadata | Yes | No | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| University Hackathons | AGGREGATOR | Intended: public event discovery | Discover events and capture core metadata | Yes | Yes | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| GitHub Events | DISCOVERY | Intended: announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Reddit | DISCOVERY | Intended: announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Discord | DISCOVERY | Intended: announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Telegram | DISCOVERY | Intended: announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| LinkedIn | DISCOVERY | Intended: announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| X (Twitter) | DISCOVERY | Intended: announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Facebook | DISCOVERY | Intended: announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Google Events | DISCOVERY | Intended: announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |

## Notes

- Primary sources are the authoritative ingestion layer and are expected to support full metadata extraction and incremental updates.
- Aggregator sources enrich coverage with discoverable event information but are not expected to match the metadata completeness of primary sources.
- Discovery sources should only surface public announcement URLs and pass them to the appropriate primary or aggregator adapter for full processing.
