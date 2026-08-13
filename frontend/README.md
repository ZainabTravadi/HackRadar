# HackRadar Frontend

React + TypeScript + Vite + Tailwind CSS frontend for HackRadar.

## Development
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Run tests: `npm run test`
4. Build for production: `npm run build`

## Environment
- `VITE_API_BASE_URL` sets the backend API base URL.
- When it is not set, the app uses `http://localhost:3001` during development and the current origin in production.

## Notes
- The join form submits to `POST /api/initiative/applications`.
- The frontend fetch layer lives in `src/lib/api.ts`.
