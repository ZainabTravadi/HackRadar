# Adapter architecture

This directory contains the source adapters used by the HackRadar crawler.

## What an adapter does

Each adapter is responsible for:

- Fetching listing pages or source data from one public platform.
- Extracting event records from the source markup or payload.
- Normalizing fields into the crawler's shared shape.
- Returning data for the validation, deduplication, and storage pipeline.

## Common structure

Most adapters follow a pattern built around:

- `baseAdapter.ts` for shared helper behavior
- `config.ts` for source-specific URLs and settings
- `parser.ts` for platform parsing logic
- `adapter.ts` for the adapter class or entrypoint

Some simpler adapters live in a single file when the source does not need a multi-file layout.

## Data flow

1. The crawler discovers a source or listing page.
2. The adapter extracts candidate event records.
3. The pipeline normalizes the records.
4. The deduplicator removes repeated listings.
5. The database stores the final normalized rows.

## Supported adapter sources

The repository currently includes adapters for sources such as:

- Devpost
- MLH
- Devfolio
- Unstop
- DoraHacks
- Taikai
- HackerEarth
- Hack2Skill
- Reskilll
- Lablab
- ETHGlobal
- AngelHack
- Hack Club
- University sources
- Eventbrite
- Luma
- Meetup
- GitHub
- Reddit
- Discord
- Telegram
- LinkedIn
- Twitter
- Facebook
- Google

There is also a manual fallback path for records that need human review.

## Validation and safety

- Keep network requests respectful and conservative.
- Do not hard-code credentials, cookies, or private tokens.
- Prefer source attribution over silent rewriting.
- Be conservative with duplicate detection inside adapters.

## Testing

- Add focused parser tests when you change source extraction logic.
- Use the debug scripts in `backend/src/debug/` to validate adapters locally.
- Keep adapter tests network-safe when possible by mocking external requests.

## Debugging helpers

Useful local scripts already exist under `backend/src/debug/` for:

- Fresh crawl validation
- Adapter verification
- Data-quality checks
- Manual normalization checks

## Notes for contributors

- Adapter changes should not alter database schema or API contracts unless absolutely necessary.
- If you add a new source, document its normalization rules and any assumptions in the adapter directory.
