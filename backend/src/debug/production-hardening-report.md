# Production Hardening Report

This report reflects the current adapter posture after the shared parser, validator, normalization, and adapter hardening pass. The status below is based on live runtime probes against the current crawler implementation rather than on compilation or unit-test success.

## Provenance notice (added for Issue #25)

- This report is a point-in-time snapshot. The original runtime probes were recorded on an unknown date. Both reports were committed on 2026-07-13, but the commit date is not the probe date: no probe timestamp, command, code revision, probed URL list, or raw output was recorded.
- The per-source counts below are preserved exactly as originally recorded. Their counting rule was never defined, and some rows do not balance (see "Counting notes"). Treat the numbers as an unverifiable snapshot, not as audited record counts.
- For intended source roles, see `source-classification-report.md`. For what the verification tooling actually measures, see "How to re-verify" below.

## Verified status

| Source | Status | Observed at probe time (unverifiable, see notice above) | Reason |
| --- | --- | --- | --- |
| Devpost | PASS | HTTP 200; 24 parsed; 15 accepted; 9 rejected; quality score 63 | The public API returned usable event listings and the validator accepted a meaningful subset. |
| MLH | LIMITED | HTTP 200; 14 parsed; 0 accepted; 14 rejected | The page returned mostly image/navigation-like items rather than hackathon records. |
| Devfolio | LIMITED | HTTP 200; 23 parsed; 0 accepted; 23 rejected | The page returned a personalized/account-centric experience instead of public hackathon listings. |
| Unstop | LIMITED | HTTP 200; 18 parsed; 0 accepted; 18 rejected | The API returned entries that were rejected by the stricter validator as incomplete or non-event-like. |
| DoraHacks | FAIL | HTTP 404 on the listing URL | The main listing endpoint was not available at runtime. |
| TAIKAI | LIMITED | HTTP 200; 4 parsed; 0 accepted; 4 rejected | The listing page yielded generic or non-event content that failed validation. |
| HackerEarth | LIMITED | HTTP 200; 23 parsed; 0 accepted; 23 rejected | The page returned navigation/landing content rather than event cards. |
| Hack2Skill | LIMITED | HTTP 200 on two pages; page 2 returned different records, but 0 accepted | Pagination worked, but the adapter still rejected the items as insufficiently complete. |
| Reskilll | LIMITED | HTTP 200; 0 parsed; 0 accepted | The source returned no usable event data. |
| Lablab | LIMITED | HTTP 200; 12 parsed; 0 accepted; 9 rejected | The page exposed generic event cards that failed the stricter event validation. |
| ETHGlobal | LIMITED | HTTP 200; 7 parsed; 0 accepted; 7 rejected | The listings were too sparse or non-event-like for the validator to accept. |
| AngelHack | LIMITED | HTTP 200; 7 parsed; 0 accepted; 4 rejected | The site is reachable, but the returned event content did not survive validation. |
| Hack Club | LIMITED | HTTP 200; 25 parsed; 0 accepted; 1 rejected | The page returned mostly external links and generic portal content. |
| University | LIMITED | HTTP 200 listing + 6 detail pages fetched; 0 accepted | The listing pages are reachable, but the parsed records are not strong enough to pass validation. |
| Eventbrite | LIMITED | HTTP 200; 12 parsed; 0 accepted; 12 rejected | The crawler picked up generic search/navigation content rather than actual event cards. |
| Luma | LIMITED | HTTP 200; 12 parsed; 0 accepted; 12 rejected | The page returned generic landing content rather than a reliable event feed. |
| Meetup | LIMITED | HTTP 200; 5 parsed; 0 accepted; 5 rejected | The listing page is heavily UI-structured and did not expose valid hackathon records. |
| GitHub Events | LIMITED | HTTP 200; 2 parsed; 0 accepted; 2 rejected | The page returned unrelated or generic content instead of structured hackathon events. |
| Reddit | LIMITED | HTTP 200; 0 parsed; 0 accepted | The source returned no usable event data in the probe. |
| Discord | LIMITED | HTTP 200; 8 parsed; 0 accepted; 8 rejected | The home page content was not a valid hackathon listing feed. |
| Telegram | LIMITED | HTTP 200; 8 parsed; 0 accepted; 8 rejected | The channel view did not expose sufficient structured event data. |
| LinkedIn | LIMITED | HTTP 200; 0 parsed; 0 accepted | The page did not yield any crawler-extractable event items. |
| Twitter | LIMITED | HTTP 200; 0 parsed; 0 accepted | The search page was not usable for structured event extraction. |
| Facebook | FAIL | HTTP 400 on the search URL | The event search endpoint was not accessible to the crawler. |
| Google | LIMITED | HTTP 200; 1 parsed; 0 accepted; 1 rejected | Search results were generic and failed validation. |

## Counting notes (added for Issue #25)

The figures above are unchanged from the original recording. The following rows cannot be reconciled because accepted plus rejected does not equal parsed, and the original counting rule is unknown:

- Lablab: 12 parsed, 0 accepted, 9 rejected (3 unaccounted).
- AngelHack: 7 parsed, 0 accepted, 4 rejected (3 unaccounted).
- Hack Club: 25 parsed, 0 accepted, 1 rejected (24 unaccounted).

The Hack2Skill, Reskilll, University, Reddit, LinkedIn, and Twitter rows record no rejected count, and only the Devpost row records a quality score. No corrections have been applied because the underlying evidence is unavailable.

## How to re-verify (added for Issue #25)

- `backend/src/debug/verifyAdapter.ts` runs a live single-adapter probe and reports recordsFound, recordsParsed, recordsValid, inserted, updated, duplicates, errors, and database state. It does not produce the accepted/rejected/quality-score columns used above, and it requires network access and a live database.
- `backend/src/crawler/adapters/baseAdapter.ts` logs per-crawl quality lines where accepted equals new plus updated plus duplicates, and rejected equals failed plus invalidPages. These definitions differ from a plain record count.
- A future re-verification should record the date, command, code revision, probed URLs, and raw output alongside the results.

## Takeaways

- Devpost is the only adapter that clearly passed the runtime bar in this verification pass.
- The hardening changes are working as intended: the shared pipeline now rejects weak, generic, or navigation-like content instead of fabricating records.
- Several platforms are either rate-limited, anti-bot protected, account-gated, or simply do not expose a reliable public event feed. These should remain LIMITED or FAIL rather than being treated as fully production-ready.
