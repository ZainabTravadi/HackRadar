# HackRadar Backend

This package contains the Node.js + TypeScript API, crawler runtime, and fellowship services for HackRadar.

## Development

```bash
npm ci
npm run dev
```

## Validation

```bash
npm ci
npm run test:unit
npm run build
```

## Production start

```bash
npm start
```

The production entrypoint is `dist/server.js`. The web process listens on `0.0.0.0` and uses `process.env.PORT` when it is present.

The crawler bootstrap in `src/index.ts` is intentionally disabled by default in production. Set `RUN_STARTUP_TASKS=true` only if you explicitly want that one-off bootstrap behavior.

## Health check

- `GET /health`

## Environment

Required for production database access:

- `DATABASE_URL`

Required for initiative submission mail:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `RECEIVE_EMAIL`

Optional mail tuning:

- `SMTP_FROM`
- `SMTP_SECURE`
- `SMTP_REQUIRE_TLS`
- `SMTP_TIMEOUT_MS`

Required for Fellowship and GitHub-backed contributor data when those features are used:

- `GITHUB_TOKEN` or `GH_TOKEN`
- `GITHUB_REPOSITORY`

Required for cross-origin browser access from the frontend:

- `FRONTEND_URL`

Required for internal crawler and Fellowship automation:

- `HACKRADAR_INTERNAL_SECRET`

Optional runtime controls:

- `API_PORT` for local development only
- `RUN_STARTUP_TASKS`
- `LOCAL_SCHEDULER`
- `ENABLE_DISCOVERY`
- `ENABLE_INCREMENTAL`
- `LOCK_TTL_MS`
- `MAX_CONCURRENT_SOURCES`

## Heroku notes

- Use the GitHub-connected Heroku Dashboard deployment flow.
- Set the build command to `npm run build`.
- Set the start command to `npm start`.
- No Procfile is required unless you prefer one for your own workflow.
- Add the required environment variables in the Heroku config vars UI.

## Copy into a future `HackRadar-Backend` repo

- `backend/src/`
- `backend/db/`
- `backend/scripts/`
- `backend/test/`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/tsconfig.json`
- `backend/drizzle.config.ts`
- `backend/README.md`
- `backend/.env.example`
