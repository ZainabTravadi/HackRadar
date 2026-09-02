<p align="center">
  <img src="assets/detective.png" width="300" alt="Hackradar Logo">
</p>

<h1 align="center">HackRadar</h1>

<p align="center">
  <a href="https://www.codetriage.com/zainabtravadi/hackradar">
    <img src="https://www.codetriage.com/zainabtravadi/hackradar/badges/users.svg" alt="CodeTriage">
  </a>
</p>

<p align="center">
  <strong>It finds the hackathons you didn't know existed.</strong><br />
  HackRadar aggregates hackathons from across the web into one searchable platform, helping builders discover opportunities by deadline, theme, format, and more.
</p>

**Quick links**

| Explore | Contribute | Community |
| --- | --- | --- |
| [Hackathons](./frontend/src/pages/Hackathons.tsx) | [Join](./frontend/src/pages/Join.tsx) | [Contributors](./frontend/src/pages/Contributors.tsx) |
| [Leaderboard](./frontend/src/pages/Leaderboard.tsx) | [Docs](./frontend/src/pages/Docs.tsx) | [Roadmap](./frontend/src/pages/Roadmap.tsx) |

_No official logo asset is committed in this repository yet, so the README uses the HackRadar wordmark for now._

## 🔷 What is HackRadar?

Hackathons are scattered across many platforms, community pages, and event hubs. Finding the right opportunity often means jumping between tabs, re-checking deadlines, and trying to compare listings that all look slightly different.

HackRadar is the discovery layer that brings those public hackathon listings into one searchable, filterable experience. It aggregates events from multiple sources, preserves attribution to the original host, and presents the results in a single place that is easy to browse.

## 🔵 Why HackRadar?

- Discover hackathons in one place
- Search and filter opportunities without the tab overload
- See deadlines, eligibility, themes, prizes, and participation modes
- Preserve original source attribution
- Reduce the time spent searching across multiple platforms
- Keep the project open-source and community-driven

## 🔹 How It Works

```text
Hackathon platforms
  ↓
HackRadar crawler
  ↓
Normalization + deduplication
  ↓
HackRadar database
  ↓
Discovery API
  ↓
HackRadar website
```

The public website is the product surface. The crawler and backend keep the data fresh, normalized, and easy to browse.

## 💙 Features

| Feature | What it gives you |
| --- | --- |
| Hackathon discovery | Browse public hackathon listings in one place |
| Search | Find events by name, theme, platform, or related details |
| Filters | Narrow results by status, mode, country, and other metadata |
| Hackathon details | Open each event with structured public information |
| Source attribution | Always link back to the original event page |
| Multi-platform aggregation | Combine listings from many public sources |
| Deadline and status information | Surface closing dates and live event status |
| Open-source contribution | Invite the community to improve the project |
| HackRadar Fellowship | Track official contributors who join the program |
| Fellowship leaderboard | Show public recognition for merged Fellowship work |
| Contributor directory | Highlight the wider HackRadar contributor community |
| Community-driven improvements | Keep the product evolving in the open |

## 🟦 HackRadar Fellowship

HackRadar Fellowship is for contributors who officially join through the Fellowship application.

- Fellowship membership is tied to the official application process, not just PR activity.
- Contributions are tracked through GitHub and merged work.
- Non-Fellowship contributors can still contribute and appear on the public Contributors page.
- The public leaderboard only includes Fellowship members with recorded merged contributions.

Points are based on contribution difficulty, not raw lines of code:

| Difficulty | Points |
| --- | ---: |
| Easy | 5 |
| Medium | 15 |
| Hard | 30 |
| Expert | 50 |

> Points are awarded for merged work that has been reviewed and accepted, not for opening a PR.

Public Fellowship views only expose safe public fields such as GitHub username, avatar, points, merged PR counts, contribution areas, and rank. Private application fields like email, motivation, availability, and LinkedIn links are not exposed publicly.

## 🔷 Open Source

HackRadar is built in the open, and contributions are welcome from both technical and non-technical contributors.

Common contribution lanes include:

| Track | What it covers |
| --- | --- |
| Frontend | UI, layout, accessibility, and user experience improvements |
| Backend | API work, data handling, services, and server-side logic |
| Crawler / Data | Source adapters, normalization, deduplication, and data quality |
| Design / UX | Visual polish, interaction design, and presentation |
| Documentation | Guides, reference docs, and project clarity |
| Community / Outreach | Contributor growth, onboarding, and project communication |
| Testing | Coverage, regressions, and reliability |
| Accessibility | Inclusive experiences and usability improvements |

Read more in [CONTRIBUTING.md](./CONTRIBUTING.md).

## 🔵 Architecture

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix / shadcn-style components

### Backend

- Node.js
- TypeScript
- PostgreSQL
- Drizzle ORM
- Playwright
- Cheerio

HackRadar uses an adapter-based crawler architecture. Platform-specific adapters live in `backend/src/crawler/adapters/`, which makes it easier to add new sources without rewriting the whole pipeline.

## 🔹 Repository Structure

```text
frontend/
backend/
.github/
scripts/
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
README.md
```

## 💙 Getting Started

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

If you need the frontend to point at a non-default backend, set `VITE_API_BASE_URL`. When it is not set, the app uses `http://localhost:3001` during development.

### Backend

```bash
cd backend
npm ci
npm run dev
```

The backend requires PostgreSQL and these environment variables for production use:

- `DATABASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `RECEIVE_EMAIL`

Optional backend settings include `SMTP_FROM`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_TIMEOUT_MS`, `API_PORT`, `GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_REPOSITORY`, `FRONTEND_URL`, `HACKRADAR_INTERNAL_SECRET`, `RUN_STARTUP_TASKS`, `LOCAL_SCHEDULER`, `ENABLE_DISCOVERY`, `ENABLE_INCREMENTAL`, `LOCK_TTL_MS`, and `MAX_CONCURRENT_SOURCES`.

## Deployment Readiness

HackRadar stays a monorepo, but it is now ready to be copied into two separate deployment repositories later:

- `backend/` for Heroku.
- `frontend/` for Vercel.

The current repository remains the source of truth for CI, contributor automation, Fellowship workflows, and shared documentation.

### Production relationship

- The frontend reads its API origin from `VITE_API_BASE_URL`.
- The backend allows browser requests from `FRONTEND_URL`.
- The backend exposes `GET /health` for readiness checks.
- The backend `npm start` command launches the web server only; crawler bootstrap tasks stay opt-in.

### Manual deployment notes

- Heroku does not need a Procfile for this repo unless you prefer one.
- Vercel uses the included `frontend/vercel.json` rewrite so deep links work on refresh.

## 🔷 Contributing

1. Find an issue in the track that matches your skills.
2. Pick a contribution lane and work on the issue.
3. Open a pull request with a clear summary of the change.
4. CI checks the contribution automatically.
5. Maintainers review, discuss, and merge when it is ready.
6. Fellowship contributions receive points when the work is merged and matches the Fellowship rules.

Start with [CONTRIBUTING.md](./CONTRIBUTING.md).

## 🔵 Community & Governance

HackRadar is community-driven and designed to be transparent.

- [Governance](./frontend/src/pages/Governance.tsx)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security](./SECURITY.md)
- [Transparency](./frontend/src/pages/Transparency.tsx)
- [Roadmap](./frontend/src/pages/Roadmap.tsx)

## 🔹 Roadmap

The current roadmap focuses on four lanes:

- **Now** - discovery improvements, the Join flow, contributors, and documentation / transparency pages
- **Next** - crawler health summaries, API improvements, and normalization / deduplication refinements
- **Exploring** - SDKs, contributor recognition, and improved search / recommendations
- **Completed** - the discovery UI and filters, the normalized API, and the community Join flow

See the full page here: [Roadmap](./frontend/src/pages/Roadmap.tsx)

## 💙 Project Links

| Surface | Route | Link |
| --- | --- | --- |
| HackRadar website | `/` | [Homepage source](./frontend/src/pages/Index.tsx) |
| Discover Hackathons | `/hackathons` | [Hackathons page source](./frontend/src/pages/Hackathons.tsx) |
| Join Fellowship | `/join` | [Join page source](./frontend/src/pages/Join.tsx) |
| Contributors | `/contributors` | [Contributors page source](./frontend/src/pages/Contributors.tsx) |
| Leaderboard | `/leaderboard` | [Leaderboard page source](./frontend/src/pages/Leaderboard.tsx) |
| Roadmap | `/roadmap` | [Roadmap page source](./frontend/src/pages/Roadmap.tsx) |
| Transparency | `/transparency` | [Transparency page source](./frontend/src/pages/Transparency.tsx) |
| Documentation | `/docs` | [Docs page source](./frontend/src/pages/Docs.tsx) |
| GitHub repository | `main` branch | [ZainabTravadi/HackRadar](https://github.com/ZainabTravadi/HackRadar) |

## 🔷 License

This repository does not currently include a LICENSE file. Licensing is pending maintainer decision.

The documentation is corrected and the issue of Improper documentation is resolved.