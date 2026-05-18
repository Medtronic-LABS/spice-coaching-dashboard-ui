# Contributing

Thanks for your interest in contributing to the SPICE Coaching Dashboard UI.

## Development setup

```bash
git clone https://github.com/Medtronic-LABS/spice-coaching-dashboard-ui.git
cd spice-coaching-dashboard-ui
npm install
cp .env.example .env
npm run dev
```

## Required checks before opening a PR

```bash
npm test           # vitest unit tests
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

All three must pass. The CI workflow runs the same set on every push.

## Branch and PR conventions

- Branch off `main`. Use a short, kebab-case name prefixed with the change
  type, e.g. `feat/quiz-export`, `fix/sidebar-badge`, `chore/bump-vite`.
- Keep PRs focused and reasonably small. One logical change per PR.
- Write a clear title (under 70 chars). Use the body for context, screenshots
  for any UI change, and a brief test plan.
- Rebase on `main` before requesting review; squash on merge.
- Reference any related issue in the PR description.

## Code style

- TypeScript strict mode is on — please don't disable rules locally.
- Run `npm run format` (Prettier) before pushing.
- Prefer feature-folder structure (`src/features/<feature>/...`) for
  feature-scoped components, hooks, and RTK Query slices.

## Project structure and architecture

See `docs/` for the UI component system spec and other architecture notes.
