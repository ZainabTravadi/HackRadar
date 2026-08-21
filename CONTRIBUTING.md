# Contributing to HackRadar

Thank you for wanting to help. HackRadar is an open-source hackathon discovery platform, and we try to make the contributor path clear, safe, and welcoming.

## 1. What HackRadar is

HackRadar discovers public hackathon listings, normalizes them, deduplicates them, and serves them through a web UI and API.

## 2. Who can contribute

Anyone can contribute if they follow the project rules, respect the Code of Conduct, and avoid sharing secrets or private data.

### HackRadar Contribution Rule

⭐ Before contributing, please star the HackRadar repository.

For pull requests:
- A repository star is required before the PR can proceed.
- If the PR is blocked by the `star-required` check, star the repository.
- After starring, PUSH A NEW COMMIT to your PR branch so GitHub Actions can verify the star and unblock the PR.

Please read `CONTRIBUTING.md` before opening a PR.

## 3. Contribution tracks

The formal GitHub tracks are:

- Frontend
- Backend
- Crawler and data
- Design and UX
- Documentation
- Community
- Testing
- Accessibility

The Join page on the site also accepts broader interest areas such as outreach, translation, and partnerships, but the GitHub issue templates use the formal tracks above.

## 4. How to find an issue

1. Open the Issues tab.
2. Check the structured issue forms first.
3. Read the issue body, labels, and linked context carefully.
4. Search for duplicates before starting work.

## 5. How to create or claim an issue

1. Choose the issue form that matches your track or problem type.
2. Fill in your name, GitHub username, motivation, approach, skills, scope, links, and confirmations.
3. If the issue is meant to be a contribution request, the form will apply the right track label.
4. If the issue is already open and you want to work on it, look for the `up-for-grabs` label. If it is present, comment `/assign` or `/claim` on the issue to request assignment.
5. The workflow will only assign the issue if it is still unassigned and eligible for contributor ownership.
6. If someone else already owns the issue, the workflow will leave a clear comment and keep the current assignment intact.

## 6. 72-hour ownership rule

When an issue is assigned to a contributor, they have 72 hours to open a PR that shows real progress.

This rule is not punitive. It exists so issues do not stay locked forever if someone goes inactive. If the 72-hour window expires without a qualifying PR, the assignment is cleared and the issue becomes available again.

## 7. How to create a branch

Use a short branch name that includes the issue number or track when possible.

Examples:

- `frontend/123-search-filters`
- `crawler/245-devpost-parser`
- `docs/readme-refresh`

## 8. Branch naming convention

Prefer:

- `track/issue-number-short-slug`
- `fix/issue-number-short-slug`
- `docs/short-slug`

Keep branch names readable and avoid secrets or personal information in the branch name.

## 9. How to develop locally

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

### Backend

```bash
cd backend
npm ci
npm run dev
```

The backend entrypoint starts the server and also runs the crawler bootstrap flow.

## 10. Frontend commands

- `npm run dev`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test`
- `npm run build`

## 11. Backend commands

- `npm run dev`
- `npm run test:unit`
- `npm run build`

## 12. Testing

Run the tests that fit your change.

- UI changes should run the frontend test suite.
- Backend changes should run the backend unit tests.
- Crawler or adapter changes should include local validation and, when practical, focused tests.

## 13. Linting

Frontend linting is part of the standard contributor workflow.

```bash
cd frontend
npm run lint
```

## 14. Building

Build both sides before opening a PR when your change affects runtime code.

```bash
cd frontend
npm run build

cd ../backend
npm run build
```

## 15. How to open a PR

1. Push your branch.
2. Open a pull request against `main`.
3. Use the PR template.
4. Link the relevant issue.
5. Describe the change, testing, and any screenshots if the UI changed.

## 16. PR template expectations

The PR template asks for:

- What the PR does
- The related issue
- The track
- HackRadar Fellowship participation
- Changes made
- Testing
- Screenshots or recordings when relevant
- A checklist

Please keep the template intact so automation can read the issue link and fellowship state reliably.

## 17. Issue linking

Use closing keywords in PRs:

- `Closes #123`
- `Fixes #123`
- `Resolves #123`

These help the workflow inherit labels from the linked issue.

## 18. HackRadar Fellowship workflow

If a contribution is part of the HackRadar Fellowship:

- Submit the official initiative application and include your GitHub username.
- Use the Fellowship-related issue form and optionally select a suggested difficulty.
- Maintainers apply the authoritative `difficulty: easy`, `difficulty: medium`, `difficulty: hard`, or `difficulty: expert` label.
- Check the fellowship box in the PR template if the work is Fellowship-related.
- The canonical GitHub label is `hackradar fellowship`.

The automation will apply the Fellowship label to the issue and inherit it to the PR. Points are awarded only after a linked PR is merged, and the contribution ledger prevents duplicate awards for the same PR.

## 19. How Fellowship points work

Fellowship points are based on merged contribution difficulty, not raw lines of code.

- Easy: `+5`
- Medium: `+15`
- Hard: `+30`
- Expert: `+50`

The leaderboard only includes Fellowship participants with a valid application record in PostgreSQL and recorded merged work. The broader `/contributors` page is separate and includes the full open-source contributor community.

## 20. Review process

1. A structured issue is opened.
2. GitHub labels and assigns it when possible.
3. You have 72 hours to open a linked PR.
4. CI runs automatically on the PR.
5. Maintainers review the change and request updates if needed.
6. Once merged, the work is complete.

## 21. Duplicate issue etiquette

- Search first.
- If you find a likely duplicate, link the existing issue instead of creating a second one.
- Automated duplicate detection is advisory, not final.
- Maintainers have the final call.

## 22. Security rules

- Do not commit secrets, tokens, private keys, or `.env` files.
- Do not paste sensitive production data into issues or PRs.
- Do not run production crawling against external sites unless the repository already provides a safe, mocked path for it.
- Treat GitHub issue and PR text as untrusted input.

## 23. Code of Conduct

Please read `CODE_OF_CONDUCT.md` before participating.

## 24. How to report security problems

Follow `SECURITY.md` for responsible disclosure. If the issue could expose user data, credentials, or production systems, do not post it publicly.

## Project structure

- `frontend/` - React and Vite UI
- `backend/` - Node.js API, crawler, and database code
- `backend/src/crawler/adapters/` - Source adapters
- `.github/` - Issue forms, workflows, and contributor automation

## Contributor notes

- Use the Join page if you want to introduce yourself before choosing an issue.
- Keep PRs focused.
- Update docs when your change affects behavior.
- Prefer small, reviewable contributions.
