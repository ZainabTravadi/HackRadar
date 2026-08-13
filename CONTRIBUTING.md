# Contributing to HackRadar

Thank you for your interest in contributing. This file provides a concise starting point.

## Project structure
- `frontend/` - React + Vite UI
- `backend/` - Node + TypeScript API, Drizzle ORM, crawler
- `backend/src/crawler/adapters/` - source adapters

## Quick start
1. Install frontend dependencies: `cd frontend && npm install`
2. Run the frontend dev server: `npm run dev`
3. Run frontend tests: `npm run test`
4. Install backend dependencies: `cd backend && npm install`
5. Set `DATABASE_URL` in `backend/.env` for local development
6. Build the backend: `npm run build`
7. Run backend unit tests: `npm run test:unit`

## Crawler adapters
Adapters live in `backend/src/crawler/adapters/`. Each adapter should:
- implement a stable interface for fetching events from a source
- normalize fields into the common model used by the pipeline
- avoid publishing private credentials

## Tests and lint
- Frontend: `npm run test`, `npx tsc --noEmit`, `npm run lint`
- Backend: `npm run test:unit`, `npm run build`

## Safety and policy
- Never commit secrets or credentials.
- Do not run migrations against production databases.
- Respect source platform terms and robots.txt when writing adapters.

## How to contribute
- Fork the repo, create a branch, and open a PR against `main`.
- Describe the change and include tests where appropriate.

## Resources
- Repository: https://github.com/ZainabTravadi/List-Of-Hackathons
