# Adapter documentation

This folder contains source adapters used by the crawler. Each adapter is responsible for:

- Fetching event data from a particular external platform.
- Parsing and normalizing the platform's payload into the project's common model.
- Emitting events to the crawler pipeline for deduplication and storage.

Adapter guidance:
- Keep network requests respectful (rate limits, backoff). Check the target site's terms of service.
- Normalize fields into: title, organizer, registrationDeadline, submissionDeadline, event dates, mode, location, themes/tags, prize, source, sourceUrl.
- Use shared helpers in `backend/src/crawler/adapters/baseAdapter.ts` where appropriate.
- Provide unit tests for parsing logic when feasible.

Error handling & retries:
- Transient failures should be retried by the scheduler or queue.
- Permanent errors (missing selectors, changed HTML) should be recorded for manual review.

Deduplication:
- Be conservative: prefer flagging possible duplicates for the deduplicator rather than dropping records silently.

Debugging:
- Use the repository's debug scripts in `backend/src/debug/` for local runs and quality checks.

Privacy & safety:
- Do not store or expose private user data.
- Do not include credentials in code or logs.

*** End of adapter README ***
