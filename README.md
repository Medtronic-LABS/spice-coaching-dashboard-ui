# SPICE Coaching Dashboard UI

Dashboard UI for the SPICE Coaching Platform — a micro-learning analytics dashboard
for supervisors and program managers, built with React 18, TypeScript (strict),
Vite, Redux Toolkit + RTK Query, Tailwind CSS, React Router v6, and Vitest.

## Quickstart

```bash
npm install
cp .env.example .env
npm run dev
```

Other scripts:

```bash
npm run build       # production build
npm test            # run unit tests (vitest)
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run format      # prettier write
```

## Environment variables

The variables below are read from a `.env` file (see `.env.example` for the
canonical list). Only variables prefixed with `VITE_` are exposed to the
browser bundle.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL for the supervisor/CHW analytics backend (example: `https://api.example.com/api/v1`). Used when `VITE_USE_MOCK_API` is `false`. |
| `VITE_ADMIN_API_BASE_URL` | Base URL for the admin module-creation pipeline (example: `http://localhost:8001`). |
| `VITE_ADMIN_REVIEWER_ID` | UUID sent as the `X-Reviewer-Id` header on admin calls. Empty by default — set per deployment. |
| `VITE_ADMIN_REVIEWER_TOKEN` | Token sent as the `X-Reviewer-Token` header on admin calls. Empty by default — set per deployment. |
| `VITE_USE_MOCK_API` | `true` to serve RTK Query endpoints from local mock data; `false` to hit `VITE_API_BASE_URL`. |
| `VITE_USE_MOCK_MODULE_PIPELINE` | `true` (default) to mock the admin module-creation pipeline; `false` to call the real admin server at `VITE_ADMIN_API_BASE_URL`. |
| `VITE_APP_ROLE` | Role switch for UI routing: `supervisor` or `programManager`. |

## Backend repo

The companion backend lives at
[Medtronic-LABS/spice-coaching](https://github.com/Medtronic-LABS/spice-coaching).

## Production deployment

This repo ships with mock-mode toggles intended for local development. Before
deploying to a real environment:

- Set `VITE_USE_MOCK_API=false` and provide a real `VITE_API_BASE_URL`.
- Set `VITE_USE_MOCK_MODULE_PIPELINE=false` and provide a real
  `VITE_ADMIN_API_BASE_URL`.
- Replace the empty `VITE_ADMIN_REVIEWER_ID` and `VITE_ADMIN_REVIEWER_TOKEN`
  with real values issued by the backend. The defaults are intentionally empty
  so unconfigured deployments fail loudly rather than authenticating as a
  development placeholder.
- Review every entry in `.env.example` and confirm it has a production value.

## License

Apache License 2.0 — see [LICENSE](./LICENSE).

## Security

See [SECURITY.md](./SECURITY.md) for the vulnerability disclosure policy.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, branch
conventions, and pull-request guidelines.
