# GitHub Automation

HackRadar uses GitHub-native workflows to keep contributor work organized and maintainable.

## `ci.yml`

- Purpose: run frontend and backend checks on every pull request and on pushes to `main`.
- Trigger: `pull_request`, `push` to `main`.
- Permissions: `contents: read`.
- What it changes: nothing. It only reports status checks.
- Failure behavior: fails the workflow when lint, typecheck, tests, or build fail.
- Debugging: rerun the job locally with the same commands listed in `CONTRIBUTING.md`.

## `issues.yml`

- Purpose: ensure labels exist, apply canonical labels, detect duplicates, and auto-assign issue creators.
- Trigger: `issues` opened, reopened, edited, plus `issue_comment` created for `/claim`.
- Permissions: `contents: read`, `issues: write`.
- What it changes: labels, comments, and assignees on issues.
- Failure behavior: logs permission failures and leaves the issue open.
- Debugging: inspect the workflow logs and the event payload. The shared logic lives in `scripts/hackradar-contributor-automation.mjs`.

## `pr-labels.yml`

- Purpose: inherit relevant labels from linked issues and apply fellowship tracking to PRs.
- Trigger: `pull_request` opened, reopened, synchronize, edited.
- Permissions: `contents: read`, `issues: write`.
- What it changes: PR labels only.
- Failure behavior: if the token cannot write labels, the workflow logs the failure and exits without touching code.
- Debugging: confirm the PR body includes `Closes #123`, `Fixes #123`, or `Resolves #123`, then re-run the workflow.

## `fellowship.yml`

- Purpose: record merged Fellowship contributions exactly once and persist them in PostgreSQL.
- Trigger: `pull_request` closed when merged, plus manual dispatch.
- Permissions: `contents: read`, `issues: read`, `pull-requests: read`.
- What it changes: nothing in GitHub itself. It posts contribution records to the backend ledger.
- Failure behavior: duplicate PRs are ignored, non-Fellowship PRs are skipped, and backend or network failures are logged without awarding points twice.
- Debugging: make sure the merged PR links a HackRadar contribution issue, the issue has a maintainer-approved difficulty label, and the contributor has an official Fellowship application with a GitHub username.

## `ownership-expiry.yml`

- Purpose: clear assignments that have been idle for more than 72 hours without a qualifying PR.
- Trigger: hourly schedule and manual dispatch.
- Permissions: `contents: read`, `issues: write`.
- What it changes: removes assignees, adds a comment marker, and may add `needs triage`.
- Failure behavior: leaves the issue open and logs the failure if permissions are missing.
- Debugging: check the assigned timestamp in the issue events and verify whether a qualifying PR was created before the deadline.

## Shared automation script

The workflows all call `scripts/hackradar-contributor-automation.mjs`, which handles:

- label bootstrapping
- issue track detection
- fellowship detection
- duplicate detection
- issue assignment and claim handling
- PR label inheritance
- ownership expiry calculations

The script is intentionally conservative. It avoids removing maintainer-added labels, does not close issues automatically, and does not execute untrusted shell commands from issue or PR content.
