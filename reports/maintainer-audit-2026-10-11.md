# HackRadar Maintainer Remediation Audit — 2026-10-11

## A. Executive summary

The local star-verification workflow had a confirmed control-flow defect: a verified or missing-star result could be overwritten by later check, label, or comment API failures. The workflow now fixes the result before attempting independent best-effort side effects, records secondary failures as warnings, and keeps an unstarred result failing. Ten mocked regression scenarios exercise the actual JavaScript embedded in the workflow. The new test is included in CI.

The latest `origin/main` was fetched and verified at `727f304f5985f7c27a7c751ab2fa79f5af2470d4`, matching the local branch base. No changes were made to either contributor PR. PR #27 still contains unqualified “Production-ready” claims that conflict with its runtime snapshot; PR #29 improves side-effect handling but still has control-flow gaps and no regression tests. Both need changes.

Local frontend/backend CI-equivalent checks passed. The existing standalone contributor automation test still fails during module import because it imports missing Fellowship-related exports (tracked by open Issue #14); it was left unchanged because Fellowship automation was explicitly out of scope. GitHub run-log downloads require repository admin rights, so the exact API exception in the two star runs could not be independently read from their log archives. The public Issue #28 and check-run/job summaries provide supporting evidence, while the underlying reason for GitHub’s permission rejection remains unverified.

## B. Repository provenance and scope

- Repository: `ZainabTravadi/HackRadar`; default/base branch: `main`.
- Remote: `origin` at `https://github.com/ZainabTravadi/HackRadar`.
- Audit branch: `fix/maintainer-ci-audit-local`.
- Verified branch base: `727f304f5985f7c27a7c751ab2fa79f5af2470d4`. This was HEAD when the implementation commit was created.
- Maintenance implementation commit: `e1d5a6d` (`fix: isolate star verdict from workflow side effects`). The audit report is being added as a separate local commit after that implementation commit.
- `git fetch origin main` succeeded; fetched `origin/main`, `FETCH_HEAD`, and the base commit all matched. The worktree was clean before branch creation.
- The branch has not been pushed. All PR-head refs were fetched only as remote-tracking refs for review; contributor branches were not checked out or modified.
- No `AGENTS.md` exists in the checkout. `CONTRIBUTING.md` and `SECURITY.md` were read. Workflow inventory: `ci.yml`, `fellowship.yml`, `issues.yml`, `ownership-expiry.yml`, `pr-labels.yml`, and `star-required.yml`. No reusable workflow or composite action is referenced.
- `gh` is not installed. Public unauthenticated GitHub API reads succeeded after an approved network retry. Downloading run logs returned HTTP 403: “Must have admin rights to Repository.”
- Open PRs at audit time: [#26](https://github.com/ZainabTravadi/HackRadar/pull/26), [#27](https://github.com/ZainabTravadi/HackRadar/pull/27), and [#29](https://github.com/ZainabTravadi/HackRadar/pull/29). The targeted issues [#14](https://github.com/ZainabTravadi/HackRadar/issues/14), [#25](https://github.com/ZainabTravadi/HackRadar/issues/25), and [#28](https://github.com/ZainabTravadi/HackRadar/issues/28) were open. Other unrelated open issues were not reviewed as part of this workflow/documentation audit.

## C. Exact PR #27 review — Issue #25

- PR: [#27](https://github.com/ZainabTravadi/HackRadar/pull/27)
- Author: `yugdabgar21`; base: `main`; head: `docs/25-reconcile-readiness-reports`.
- Reviewed commit: `abca13778a11eb5fdbae9860e0fbb8b47913ddff`.
- Changed files: `backend/src/debug/production-hardening-report.md` and `backend/src/debug/source-classification-report.md` only. No crawler code or runtime behavior changes.
- Visible review submissions: none. GitHub reported mergeable, state `unstable`; current CI and PR Label Inheritance runs are waiting for maintainer approval.

Findings against Issue #25’s criteria:

| Criterion | Finding |
| --- | --- |
| Clear status for each source | The hardening table lists all sources and statuses. Counts remain a historical snapshot. |
| Readiness claims consistent with runtime evidence | **Not met.** The classification report retains its `Production Readiness` column and continues to label all primary sources “Production-ready,” while the snapshot has only Devpost marked PASS and records zero accepted records or failures for many others. A note distinguishing intended roles from runtime readiness does not qualify those explicit cells. |
| Zero-record and failed sources identified | Met in the hardening table; the PR also calls out unbalanced and missing counts. |
| Classification separated from runtime verification | Met by the new classification note and report cross-reference. |
| Verification date/context | Improved: probe date is explicitly unknown; the report commit date is not presented as the probe date. Git history shows the source reports’ prior commit on 2026-07-13. |
| No unsupported production-readiness claims | **Not met.** The explicit “Production-ready” column values remain unsupported. The hardening report also keeps its opening “current adapter posture” claim and “Verified status” heading despite the new notice that results are undated and unverifiable. |
| No implementation/runtime changes | Met. |

The path in Issue #25, `backend/src/crawler/verifyAdapter.ts`, does not exist in this checkout or in the inspected local Git history. `backend/src/debug/verifyAdapter.ts` was introduced at that path in commit `174b0ae2da5b717c9497912cdb57577287d578da`; no move from the issue’s `crawler` path was found. The issue path is outdated/incorrect for the checked-in verifier.

The verifier description in PR #27 is substantially accurate: it runs a live single-adapter crawl, validates parsed items, queries per-source database records and samples, and prints `recordsFound`, `recordsParsed`, `recordsValid`, insert/update/duplicate/error counts, database count, and status. It does not produce the hardening report’s accepted/rejected/quality-score columns. It requires live network/database access and can insert/update crawler data, so it was not run.

**Verdict: Request changes.** Keep the classification/runtime distinction, dated-context caveat, count inconsistencies, and verifier description. Remove or clearly relabel the unsupported production-readiness column and qualify the remaining “current”/“Verified” wording.

## D. Exact PR #29 review — Issue #28

- PR: [#29](https://github.com/ZainabTravadi/HackRadar/pull/29)
- Author: `yugdabgar21`; base: `main`; head: `fix/28-star-workflow-best-effort-labels`.
- Reviewed commit: `74e76aaef8b7ffd89e101e5b59a2f70d71d4c92e`.
- Changed file: `.github/workflows/star-required.yml` only; no automated tests were added.
- Visible review submissions: none. GitHub reported mergeable, state `unstable`; CI and PR Label Inheritance runs await maintainer approval.

The PR catches failures in label/comment writes and catches failure-status check publication before calling `core.setFailed`, which improves the original catch path. However:

- Label and comment listing calls are still performed before the outer `try`; failures in `issues.listLabelsOnIssue` or `issues.listComments` can abort before star verification and before publishing a status.
- On the verified-star path, `upsertCheck("success", ...)` is still inside the outer verification `try`. If creating/updating that check fails, execution enters the verification-error catch and attempts to report “Unable to verify repository star,” even though the star API already established success.
- On a missing-star result, label handling precedes publication of the failed check. The write failure is now swallowed, but the required failure-status-first ordering is not implemented.
- No tests cover check create/update failures, original-error preservation, or independent side-effect handling.

Run [38118718442](https://github.com/ZainabTravadi/HackRadar/actions/runs/38118718442) ran as `pull_request_target` for PR #29’s head SHA. Its custom star check concluded success, but job `Verify repository star` failed. `pull_request_target` executes the base-branch workflow; PR #29’s changes cannot affect that run until merged. The same success-check/failing-job pattern occurred on PR #27. The API confirmed failed step names and conclusions, but log download was denied (HTTP 403), so the exact error text for run #38118718442 is unavailable here.

Permissions and fork handling are unchanged in the PR: `checks: write`, `issues: write`, and `pull-requests: read`; it retains the existing `pull_request_target` triggers and does not check out contributor code. The API error’s underlying cause is not established: repository Actions token policy, fork-token restrictions, and platform behavior remain possibilities, not findings.

**Verdict: Request changes.** Isolate verification from every optional API call, move failure-status attempts ahead of failure-path labels, preserve original errors, and add the mocked regression coverage described in Issue #28/Phase 2.

## E. GitHub Actions failure register

| Workflow / run | Event and result | Failure evidence / cause | Remediation and verification |
| --- | --- | --- | --- |
| [Star HackRadar Repository #38055091523](https://github.com/ZainabTravadi/HackRadar/actions/runs/38055091523) | `pull_request_target`, PR #27 head `abca137…`; job `Verify repository star` failed. The separately-created `Star HackRadar Repository` check run succeeded. | Run/job result and check conclusions verified through GitHub API. Issue #28 reports that a comment operation first threw `Resource not accessible by integration`, then `issues.addLabels` threw in the catch before the failure check and `core.setFailed`. Run logs were not downloadable without repository admin rights. Source control flow corroborates the masking defect. The precise GitHub permission cause is unverified. | Fixed locally in `star-required.yml`; 10 mocked scenarios pass. Requires a new live Actions run after the maintenance fix is merged. |
| [Star HackRadar Repository #38118718442](https://github.com/ZainabTravadi/HackRadar/actions/runs/38118718442) | `pull_request_target`, PR #29 head `74e76aa…`; custom check success, workflow job failed. | Repeat of base-branch execution behavior: PR #29’s workflow edits were not in the base workflow used by this event. Exact error in this run is unverified because logs return 403. | The local fix changes the base workflow content when merged. No claim of remote success. |
| [CI #33650612676](https://github.com/ZainabTravadi/HackRadar/actions/runs/33650612676), [PR Label Inheritance #33650612656](https://github.com/ZainabTravadi/HackRadar/actions/runs/33650612656), and [Star HackRadar Repository #33650610217](https://github.com/ZainabTravadi/HackRadar/actions/runs/33650610217) | Historical checks associated with open PR #26, head `f715f0c…`; all conclude failure. | The star job’s failed step is `Verify repository star`; job details for CI and PR Label Inheritance were unavailable, and run logs require admin access. Root causes for all three are **unverified**; do not group them as one proven code defect. | Maintainer with repository admin access should inspect logs and rerun current checks. Local CI-equivalent checks passed, but do not prove those historical run causes. |
| [CI #38055091259](https://github.com/ZainabTravadi/HackRadar/actions/runs/38055091259), [PR Label Inheritance #38055091246](https://github.com/ZainabTravadi/HackRadar/actions/runs/38055091246), [CI #38118718465](https://github.com/ZainabTravadi/HackRadar/actions/runs/38118718465), [PR Label Inheritance #38118718503](https://github.com/ZainabTravadi/HackRadar/actions/runs/38118718503) | PR #27 and PR #29 `pull_request` runs; conclusion `action_required`. | Waiting for required maintainer approval for fork PR workflows; these are not code failures. | A maintainer must approve/rerun them if policy permits. No permission or workflow policy was changed. |
| Recent scheduled/issue automation runs, including [Ownership Expiry #38119350517](https://github.com/ZainabTravadi/HackRadar/actions/runs/38119350517) | Main-branch scheduled run succeeded. Recent issue automation and ownership expiry runs in the API inventory also concluded success. | No failure identified in the available recent run inventory for these workflows. This does not prove every historical run passed. | No fix required based on available evidence. |
| Local `node scripts/hackradar-contributor-automation.test.mjs` | Reproducible local failure before assertions. This test is not invoked by the current CI workflow. | Imports `difficultyToPoints` (and other helpers) that are not exported by `scripts/hackradar-contributor-automation.mjs`. Open Issue [#14](https://github.com/ZainabTravadi/HackRadar/issues/14) describes this exact failure. | Left unchanged: fixing the Fellowship/contributor scoring helper is explicitly out of scope for this remediation. Maintainer should handle Issue #14 separately. |

Workflow configuration inspected: CI uses Node 22, `npm ci`, frontend lint/typecheck/tests/build and backend unit tests/build. The star workflow has only read access to pull requests plus check/issue write scopes needed for its custom check and labels/comments. Other contributor workflows use `contents: read` and only the issue/pull-request writes they need. No `write-all`, check bypass, trigger change, or repository setting change was made.

## F. Fixes implemented

| File | Change | Regression coverage / result |
| --- | --- | --- |
| `.github/workflows/star-required.yml` | Star verification now reaches a verdict before label/comment reads or writes. Verified success is reported first; label cleanup/comment/check publication are independent best-effort attempts with warnings. Missing-star status is attempted before failure labels/comments and `core.setFailed` preserves the failure even if status publication fails. Genuine verification errors set the original error first, then attempt failure status and secondary actions independently. Exemption behavior, triggers, permission scopes, and fork-safe no-checkout behavior remain. | `node scripts/star-required-workflow.test.mjs`: 10 mocked cases passed. |
| `.github/workflows/ci.yml` | Added a backend-job step to execute the star-workflow regression test on CI; no permission changes. | YAML parsed locally; the script passes locally. Remote CI has not run for this branch. |
| `scripts/star-required-workflow.test.mjs` | Added a dependency-free harness that extracts and executes the actual `github-script` body with mocked GitHub API operations. | Covers success, missing star, API errors, label/comment/check create/update failures, operation order, combined failures, and preserved original errors. |
| `reports/maintainer-audit-2026-10-11.md` | Added this evidence-based report. | Manually reviewed against local Git and public GitHub API evidence. |

## G. Validation results

| Command/check | Result |
| --- | --- |
| `git fetch origin main`; compare `origin/main`, `FETCH_HEAD`, and local base | Passed; all `727f304f5985f7c27a7c751ab2fa79f5af2470d4`. |
| `node scripts/star-required-workflow.test.mjs` | Passed: 10 mocked scenarios. |
| `npm.cmd run test:unit` in `backend/` | Passed: initiative mail formatting, initiative validators, and Fellowship backend tests. |
| `npm.cmd run build` in `backend/` | Passed (`tsc -p tsconfig.json`). |
| `npm.cmd run test` in `frontend/` | Passed: 10 files, 39 tests. Required running outside the sandbox after its initial esbuild directory-access failure. React Router future-flag warnings were emitted. |
| `npx.cmd tsc --noEmit` in `frontend/` | Passed. |
| `npm.cmd run lint` in `frontend/` | Passed with 0 errors and 7 existing `react-refresh/only-export-components` warnings. |
| `npm.cmd run build` in `frontend/` | Passed. Vite warned that the JS chunk exceeds 500 kB and Browserslist data is old. |
| `js-yaml` parse of all `.github/workflows/*.yml` | Passed for all six workflow files. |
| Compile embedded `github-script` body with `AsyncFunction`; `node --check` new test file | Passed. |
| `git -c core.whitespace=cr-at-eol diff --check` (local and PR diffs) | Passed. The plain `git diff --check` flags CR characters as trailing whitespace because the tracked star workflow uses CRLF and local `core.whitespace` does not set `cr-at-eol`; no trailing spaces were found with the line-ending-aware check. |
| `node scripts/hackradar-contributor-automation.test.mjs` | Failed before tests execute: missing `difficultyToPoints` export. Confirmed existing defect and open Issue #14; not changed in this task due the explicit prohibition on Fellowship automation changes. |
| Live crawler verifier | Not run. It performs network crawling and database reads/writes; documentation changes do not justify those side effects. |
| GitHub Actions logs for failed runs | Not available: log download API returned HTTP 403 requiring repository admin rights. Run/check/job conclusions were retrieved separately. |
| Markdown linter / formatting command | None configured or identified; report reviewed manually. |

## H. Required maintainer actions

1. Request changes on PR #27 to resolve explicit readiness claims and contradictory “current/Verified” statements.
2. Request changes on PR #29 to isolate all status/label/comment operations and add regression tests. Do not merge either contributor PR automatically.
3. Have a repository admin inspect the log archives for runs #38055091523, #38118718442, and the PR #26 failures. The public run-log endpoint returned 403 without admin rights.
4. After the maintenance branch is reviewed and merged, rerun star verification on a test PR and confirm that a verified star remains successful under denied comment/label APIs, while missing-star and star-API-error paths still fail.
5. Approve or explicitly leave pending the `action_required` PR #27/#29 CI and label-inheritance runs according to the repository’s fork-workflow policy.
6. Review Actions → General token permissions only with repository admin access. The `Resource not accessible by integration` error is confirmed in Issue #28’s report, but the underlying setting/platform cause is not established; do not broaden permissions without that evidence.
7. Address open Issue #14 separately; its standalone test currently fails because required scoring/helper exports are missing.

## I. Remaining risks and limitations

- There is no live Actions run for this local maintenance branch, so the mocks and local CI-equivalent commands cannot establish GitHub token behavior or branch-protection outcomes.
- Public GitHub API evidence exposes the failed step and check/job conclusions, but downloading logs requires repository admin rights. The exact error for run #38118718442 remains unknown.
- PR #26’s older CI and label-inheritance failures have no accessible job details. Their cause is not inferred from current local success.
- The dated runtime report in PR #27 preserves historical counts whose counting rule/raw output is absent; no live probes were run to recreate them.
- The existing contributor automation test for Issue #14 remains locally failing and is not part of CI.
- Repository branch protection and Actions token policy settings were not accessible and were not modified.

## J. Recommended next steps

1. Review and commit this maintenance branch, then open a maintenance PR; do not push directly to `main`.
2. Require its new mocked workflow tests and normal CI checks to pass on GitHub.
3. Merge the reviewed workflow fix before relying on it for `pull_request_target` events; a PR-branch edit alone cannot change base-branch execution.
4. Rerun the failed star-verification scenario and inspect admin-only logs/settings to establish why comment/label calls were rejected.
5. Request changes on PR #27 and #29 using the findings above; keep contributor branches untouched.
6. Resolve Issue #14 in a separate change consistent with the Fellowship scoring contract.
7. Update the crawler reports only after a safe, dated, reproducible verification snapshot exists; do not treat the existing undated counts as current.
