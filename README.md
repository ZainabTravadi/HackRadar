# HackRadar

HackRadar is an open-source hackathon discovery platform that collects public listings, normalizes them, deduplicates them, and serves them through a searchable web app and API.

## What HackRadar does

- Finds hackathons and related events from public sources.
- Normalizes source-specific data into a shared model.
- Deduplicates repeated listings.
- Serves the results through a React frontend and a Node.js backend.
- Keeps contributor and maintainer workflows visible and documented.

## Why it exists

Hackathon opportunities are spread across many platforms and community pages. HackRadar makes discovery easier without pretending to be the source of truth. Every listing still links back to the original source.

## Key features

- Searchable hackathon listings.
- Filters for status, mode, country, and other event metadata.
- Adapter-based crawling for multiple public sources.
- Normalization and deduplication in the backend pipeline.
- Initiative and contributor onboarding through the Join page.
- Documentation and governance pages for newcomers.

## Architecture overview

```text
Public sources
  -> source adapters
  -> crawler and parser pipeline
  -> normalization
  -> deduplication
  -> PostgreSQL
  -> API
  -> frontend
```

The backend contains the crawler, pipeline, API routes, validation, database schema, and debug utilities. The frontend contains the public discovery UI, contributor pages, and documentation surfaces.

## Supported sources and adapters

Adapters currently present in the repository include:

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
- Manual fallback entries

See `backend/src/crawler/adapters/` for the implementation details.

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Vitest

### Backend

- Node.js
- TypeScript
- PostgreSQL
- Drizzle ORM
- Cheerio
- Playwright
- ts-node

## Local development

### Prerequisites

- Node.js 22 or newer
- npm
- PostgreSQL

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

The backend entrypoint starts the server and then runs the crawler bootstrap tasks defined in `backend/src/index.ts`.

### Crawler and adapter debugging

Use the debug scripts under `backend/src/debug/` when you need to validate crawler behavior, adapter output, or data quality locally.

## Environment configuration

### Backend

Create `backend/.env` with the variables required by the backend runtime and crawler tooling.

Typical values include:

- `DATABASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `RECEIVE_EMAIL`

Never commit secrets or production credentials.

### Frontend

- `VITE_API_BASE_URL` sets the backend API base URL.
- When it is not set, the app uses `http://localhost:3001` during development.

## Running the frontend

```bash
cd frontend
npm run dev
```

## Running the backend

```bash
cd backend
npm run dev
```

## Running the crawler

The crawler is launched by the backend entrypoint and related debug scripts.

- `cd backend && npm run dev` starts the server and the bootstrap crawl flow.
- `backend/src/debug/runFreshCrawl.ts` is useful for local reset-and-run validation.
- `backend/src/debug/fullTest.ts` and the adapter verification scripts help exercise crawler behavior without changing production code.

## Testing

### Frontend

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

### Backend

```bash
cd backend
npm run test:unit
npm run build
```

## Contributing

Start with `CONTRIBUTING.md`.

HackRadar uses structured GitHub issue forms, auto-labeling, auto-assignment, PR label inheritance, and an hourly ownership-expiry sweep to keep the contributor flow organized.

## Contribution tracks

The formal GitHub contribution tracks are:

- Frontend
- Backend
- Crawler and data
- Design and UX
- Documentation
- Community
- Testing
- Accessibility

The Join page also accepts broader interest areas such as outreach, translation, partnerships, and other collaboration notes, but the GitHub issue workflow uses the formal tracks above as the source of truth.

## HackRadar Fellowship

HackRadar tracks Fellowship participation through the official initiative application database and the canonical GitHub label `hackradar fellowship`.

- A contributor becomes a Fellowship participant when their application exists in PostgreSQL and includes a GitHub username.
- The `/contributors` page shows the broader open-source community, including people who are not in the Fellowship.
- The `/leaderboard` page only shows Fellowship members with recorded merged contributions.
- Issue forms include a suggested difficulty field, but maintainers set the authoritative `difficulty: easy|medium|hard|expert` label before points are awarded.
- PRs inherit the Fellowship label from linked Fellowship issues, and merged PRs are recorded only once in the contribution ledger.
- Points are awarded for merged work using the difficulty scale below, not raw lines of code.

### Points

- Easy: `+5`
- Medium: `+15`
- Hard: `+30`
- Expert: `+50`

### Public data

Public Fellowship views only expose safe fields such as GitHub username, avatar, points, merged PR counts, contribution areas, and rank. Private application fields like email, motivation, availability, and LinkedIn links are never exposed publicly.

## Governance

See `frontend/src/pages/Governance.tsx` and the governance sections of the contributor docs for the project values and decision flow.

## Security

Security-sensitive reports should follow `SECURITY.md`. Do not post secrets, credentials, or exploit details in public issues.

## Code of Conduct

See `CODE_OF_CONDUCT.md`.

## License status

This repository does not currently declare an official license file. If that changes, the license should be added to the repository explicitly and documented here.
