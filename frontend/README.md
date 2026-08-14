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

- `VITE_API_BASE_URL` points the app at the backend API.
- If it is not set, the app defaults to `http://localhost:3001` during development.

## Contributor notes

- The Join page collects broader contribution interests, including outreach, translation, and partnerships.
- The formal GitHub contribution tracks are documented in `.github/hackradar-contributor-config.json` and in the root `CONTRIBUTING.md`.
- Frontend issues should use the structured GitHub issue form for the `frontend` track when the work is about the UI, interaction, or accessibility.
