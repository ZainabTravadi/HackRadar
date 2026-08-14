# HackRadar Frontend

This package contains the React + TypeScript + Vite frontend for HackRadar.

## What lives here

- Public discovery pages
- Hackathon detail views
- Contributor pages such as Join, Governance, Docs, and Transparency
- Shared UI components and hooks
- Frontend tests

## Development

```bash
npm ci
npm run dev
```

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

## Environment

- `VITE_API_BASE_URL` points the app at the backend API in production.
- If it is not set, the app falls back to `http://localhost:3001` during local development only.

## Production deployment

- Build with `npm run build`.
- Deploy the generated `dist/` directory to Vercel.
- The repo includes `frontend/vercel.json` so direct opens of routes like `/hackathons` and `/join` resolve to the SPA entrypoint.
- Set `VITE_API_BASE_URL` in the Vercel environment settings before promoting a production deployment.

## Copy into a future `HackRadar-Frontend` repo

- `frontend/src/`
- `frontend/public/`
- `frontend/index.html`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/vite.config.ts`
- `frontend/tailwind.config.ts`
- `frontend/postcss.config.js`
- `frontend/eslint.config.js`
- `frontend/components.json`
- `frontend/vitest.config.cjs`
- `frontend/vercel.json`
- `frontend/README.md`
- `frontend/.env.example`

## Contributor notes

- The Join page collects broader contribution interests, including outreach, translation, and partnerships.
- The formal GitHub contribution tracks are documented in `.github/hackradar-contributor-config.json` and in the root `CONTRIBUTING.md`.
- Frontend issues should use the structured GitHub issue form for the `frontend` track when the work is about the UI, interaction, or accessibility.
