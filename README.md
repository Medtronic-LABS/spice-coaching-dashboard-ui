# Micro-Learning Analytics Dashboard

Web dashboard for the Medtronic AI Coaching application. Users with **coaching suite access** manage learning modules, document/video ingestion, and admin configuration. Module creation and review flows connect to the coaching platform **admin API**.

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 18, TypeScript (strict), Tailwind CSS |
| Build | Vite 5 |
| Routing | React Router v6 (lazy-loaded routes) |
| State & data | Redux Toolkit, RTK Query |
| Rich text (module editor) | TipTap, Mantine |
| Charts | Recharts (shared chart components) |
| i18n | i18next (English + Bangla) |
| Tests | Vitest, Testing Library, jsdom |

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

## Quick start

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL and related URLs
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:3000`).

### Other scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests (watch mode) |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (CI-friendly) |

Before opening a PR, run: `npm run typecheck && npm run lint && npm run test -- --run`.

Coverage (`npm run test:coverage`) enforces 90% on shared UI and tested feature components (see `vite.config.ts` excludes for heavy TipTap editors). Add co-located tests when you change behavior in pages, hooks, or new components.

## Environment variables

Copy `.env.example` to `.env`. Only `VITE_*` variables are exposed to the browser.

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Single API origin for dashboard and `/admin/*` routes (e.g. `https://host/medtronics-api`) |
| `VITE_ROUTE_PREFIX` | Public URL path for the SPA (default `/ai-coaching`; no trailing slash) |
| `VITE_COACHING_SUITE_ACCESS` | Spice `suiteAccess` key required for entry (default `coaching`) |

### How `baseApi` works

One RTK Query API uses `fetchBaseQuery` against `VITE_API_BASE_URL` with credentials included for session cookies.

Export `apiBaseUrl` from `src/store/apis/base.ts` for absolute URLs (e.g. file downloads, `EventSource`).

## Project structure

Feature-first layout: product code lives under `src/features/<feature>/`. Shared UI and app shell live outside features.

```text
src/
  features/           # Domain modules (pages, api, hooks, utils, tests)
    modules/          # Module library, review/publish, create flow
    ingest/           # Document/video upload and ingestion history
    admin-configs/    # Configurations
    auth/             # SSO bootstrap and suite-access gate
  components/
    common/           # Tables, charts, shared patterns
    layout/           # MainLayout, Header, Sidebar
    ui/               # Buttons, cards, form primitives
  routes/             # AppRoutes, lazy imports
  store/
    apis/             # baseApi (real fetch)
  constants/          # Routes
  types/              # Cross-feature types
  hooks/              # App-wide hooks (if any)
locales/              # en, bn translations
docs/                 # Specs (e.g. UI component system)
.cursor/rules/        # Team coding standards for humans & Cursor agents
```

### Architecture conventions

1. **Pages are thin** — render UI; fetch and orchestrate via hooks.
2. **API access via RTK Query** — feature `api/*.ts` files inject endpoints into `baseApi` (dashboard and `/admin/*` routes).
3. **Map API → UI** — use typed mappers/utils when backend shape differs from components (e.g. `analyticsMappers`).
4. **Named exports only** — default exports discouraged (ESLint warns on app code).
5. **Co-located tests** — `*.test.tsx` next to the module they cover.
6. **Suite access gate** — entry requires coaching suite access from the Spice profile; there is no app-level role branching.

## Code standards

This repo has **basic, enforced code standards** plus **documented team conventions**.

### Enforced (tooling)

| Tool | What it enforces |
|------|------------------|
| **TypeScript** (`strict`, `noUnusedLocals`, `noUnusedParameters`) | Strong typing, no dead locals |
| **ESLint** | TS + React + React Hooks + import rules; warns on default exports in app code |
| **Prettier** | Consistent formatting (2 spaces, single quotes, trailing commas) |
| **Husky pre-commit** | `lint-staged` (ESLint fix + Prettier on staged `.ts/.tsx`), full-project `npm run lint`, optional Qodo review script |
| **Vitest** | Behavior-focused tests with Testing Library |

Path alias: `@/` → `src/` (see `tsconfig.app.json`).

### Documented (team rules)

Team conventions live in **`.cursor/rules/`** (also useful for code review and AI-assisted development):

| Rule file | Topic |
|-----------|--------|
| `project-architecture.mdc` | Feature folders, named exports, strict TS, logic in hooks |
| `delivery-guardrails.mdc` | Minimal scope, no over-engineering |
| `react-typescript.mdc` | Components, typing, presentational vs container |
| `api-and-services.mdc` | RTK Query first, no fetch in components |
| `redux-rtk-query.mdc` | Server vs client state, tags, transforms |
| `testing-and-quality.mdc` | Vitest patterns, quality bar |
| `routing-and-layout.mdc` | Route constants, lazy loading, layouts |
| `accessibility.mdc` | Required labels/roles on shared UI and charts |

These rules are not a substitute for lint/typecheck/tests; they describe **how** we structure code so reviews stay consistent.

## Access

App entry is gated by **coaching suite access** on the Spice user profile (`hasCoachingSuiteAccess`). Users without it are redirected to Spice Web. The UI does not branch on program-manager vs other app roles.

## Documentation

- [`docs/ui-component-system-spec.md`](docs/ui-component-system-spec.md) — shared UI and chart patterns
- [`src/components/ui/README.md`](src/components/ui/README.md) — UI primitive usage

## Contributing

1. Work in the matching `src/features/<feature>/` folder.
2. Add or update tests when behavior changes.
3. Update `locales/en` and `locales/bn` for new user-visible strings.
4. Run `typecheck`, `lint`, and `test` before pushing.
5. Follow `.cursor/rules/` for structure and API patterns.
