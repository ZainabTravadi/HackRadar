# Source Classification Report

This report reclassifies each source according to its intended role in the HackRadar ecosystem.

| Source | Classification | Current Status | Capabilities | Pagination | Detail Pages | Metadata Quality | Legal Limitations | Production Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Devpost | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| MLH | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| Devfolio | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| Unstop | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| DoraHacks | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| TAIKAI | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| HackerEarth | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| Hack2Skill | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| Reskilll | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| ETHGlobal | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| lablab.ai | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| AngelHack | PRIMARY | Active public event feed | Full metadata extraction | Yes | Yes | Full | Respect platform terms and rate limits | Production-ready |
| Eventbrite | AGGREGATOR | Public event discovery | Discover events and capture core metadata | Yes | No | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| Meetup | AGGREGATOR | Public event discovery | Discover events and capture core metadata | Yes | No | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| Luma | AGGREGATOR | Public event discovery | Discover events and capture core metadata | Yes | No | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| Hack Club | AGGREGATOR | Public event discovery | Discover events and capture core metadata | Yes | No | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| University Hackathons | AGGREGATOR | Public event discovery | Discover events and capture core metadata | Yes | Yes | Partial | Do not scrape beyond public event listings or bypass restrictions | Limited |
| GitHub Events | DISCOVERY | Announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Reddit | DISCOVERY | Announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Discord | DISCOVERY | Announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Telegram | DISCOVERY | Announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| LinkedIn | DISCOVERY | Announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| X (Twitter) | DISCOVERY | Announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Facebook | DISCOVERY | Announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |
| Google Events | DISCOVERY | Announcement discovery only | Canonical URL discovery | No | No | Discovery | Only discover public announcements and enqueue canonical URLs | Discovery-only |

## Notes

- Primary sources are the authoritative ingestion layer and are expected to support full metadata extraction and incremental updates.
- Aggregator sources enrich coverage with discoverable event information but are not expected to match the metadata completeness of primary sources.
- Discovery sources should only surface public announcement URLs and pass them to the appropriate primary or aggregator adapter for full processing.
