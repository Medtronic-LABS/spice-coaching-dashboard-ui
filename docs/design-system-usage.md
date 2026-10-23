# Design System Usage

Authoritative rules for when to use shared UI primitives. See also [`ui-component-system-spec.md`](./ui-component-system-spec.md) for component APIs and [`VIKAS_UI_UX_TASKS.md`](./VIKAS_UI_UX_TASKS.md) for rollout impact.

## When to use what

| Pattern | Component | Use when | Do not use when |
|---------|-----------|----------|-----------------|
| Primary action | `Button variant="primary"` | Submit, save, confirm | Switching content panels |
| Secondary action | `Button variant="secondary"` | Cancel, alternate path | Destructive delete (use confirm dialog) |
| Section navigation | `Tabs variant="underline"` (default) | Switches entire panel/content; Team View underline style only | Showing a tag or filter state |
| Tag / metadata (“chip”) | `Badge` or `StatusBadge` | Status, role, assigned user tags | Main page navigation |
| Filter toggle | `Button` with `aria-pressed` | Toggle filter on/off in place | Replacing tab bar |
| Closed list | `Select` | ≤ ~15 options, no search | Long searchable lists |
| Searchable list | `Combobox` | Geography, users, long lists | Simple 2–3 option pickers |

## Tabs vs chips

- **Section tabs:** `Tabs` with `underline` variant (default). Purple underline on active tab, gray inactive text, left-aligned with search/filters on the right.
- **Deprecated tab variants:** `default` (gray pill bar) and `moduleLibrary` (violet pills) — do not use in new code.
- **Chips/tags:** `Badge` / `StatusBadge` only. No separate `Chip` component. Must not use `role="tab"` or underline styling.

| UI need | Component | Do not use |
|---------|-----------|------------|
| Semantic status in tables | `StatusBadge` or domain wrapper | Raw pill spans, `Tabs` |
| Generic tag / count | `Badge` | `Tabs`, underline styling |
| User + role composite | Feature composite (e.g. `AssignedUserChip`) | `role="tab"` |
| Toggle filter on/off | `Button` + `aria-pressed` | `Badge`, `Tabs` |
| Switch content panel | `Tabs variant="underline"` | Pill badges |

## Typography scale

Always use shared components — not duplicate Tailwind class strings in feature files.
Canonical class strings live in `src/components/ui/typographyClasses.ts`.

| Level | Tailwind | Component |
|-------|----------|-----------|
| Page title | `text-[24px] font-semibold leading-[32px]` | `PageTitle` |
| Page subtitle | `text-sm text-spice-text-muted` | `PageTitle` `subtitle` prop or `PageSubtitle` |
| Section title | `text-lg font-semibold` | `SectionHeader` |
| Modal title | `text-lg font-semibold` | `ModalTitle` |
| Card title | `text-sm font-semibold` | `CardTitle` |
| Field group label | `text-xs font-semibold uppercase tracking-wider` | `FieldGroupLabel` |
| Body | `text-sm` | Paragraphs, table cells, inputs |
| Form label (default) | `text-sm font-semibold text-spice-text-primary` | `FormLabel` |
| Form label (compact) | `text-xs font-semibold tracking-wide text-spice-text-medium` | `FormLabel size="compact"` |
| Caption / hint | `text-xs text-spice-text-muted` | `FormHelperText` |
| Table header | `text-xs uppercase tracking-wider` | `Table` compact density |
| Table body (primary cell) | `text-sm text-spice-text-medium` | Inherited from `Table` — do not override with `text-xs` |
| Table cell secondary line | `text-xs text-spice-text-muted` | `typographyClasses.tableCellSecondary` (subtitle under title in same cell) |
| KPI label | `text-xs font-medium text-spice-text-muted` | `StatCard` |
| KPI value | `text-2xl font-semibold leading-tight` | `StatCard` |
| Button text | `text-sm font-medium` | `Button` |

Do not use arbitrary pixel font sizes (`text-[Npx]`) in feature code.

## Tables

- **Density:** `compact` everywhere (gray uppercase thead). Do not pass `density="comfortable"`.
- **Cell text:** Primary cell content inherits `text-sm` from `Table`. Use `typographyClasses.tableCellSecondary` only for a second line inside the same cell (e.g. filename under title).
- **Page titles:** `PageTitle` at top of list/admin routes.
- **In-card table blocks:** `SectionHeader` for title + subtitle.

## Button sizes

Use the `size` prop — no `className="h-9 text-xs"` overrides on `Button`.

| Size | Dimensions | Use when |
|------|------------|----------|
| `sm` | h-8 | Table row actions, compact toolbars |
| `md` (default) | h-9 | Standard actions, modals, filter bars |
| `lg` | h-10 | Rare primary CTAs |
| `iconSm` | 32×32 | Dense table icon buttons |
| `iconMd` | 36×36 | Default icon-only buttons |

## KPI tiles (`StatCard`)

- Layout: icon + label header row → value bottom-right (optional ` / outOf`).
- Label: `typographyClasses.kpiLabel` (18px uppercase); wraps fully with `break-words` (no ellipsis clamp).
- Value: `typographyClasses.kpiValue` (38px).
- Fraction (`outOf`): muted `/{denominator}` via `typographyClasses.kpiOutOf` (28px).
- The info tooltip still provides extra context when set.

## Badge variants

| Variant | Use |
|---------|-----|
| `default` | Generic tags |
| `outline` | Bordered metadata |
| `subtle` | Low-emphasis pills (e.g. role tags) |

Sizes: `sm` | `md` (default).

## Related docs

- Component APIs and folder layout: [`ui-component-system-spec.md`](./ui-component-system-spec.md#typography)
- Component usage in `components/ui/README.md`
- Tab rollout impact: [`VIKAS_UI_UX_TASKS.md` → Impact analysis](./VIKAS_UI_UX_TASKS.md#impact-analysis--team-view-tab-standard)
- Table/title rollout: [`VIKAS_UI_UX_TASKS.md` → Task #3](./VIKAS_UI_UX_TASKS.md#impact-analysis--task-3-tables--page-titles)
- Typography task status: [`UI_UX_CONSISTENCY_BACKLOG.md` → UX-11](./UI_UX_CONSISTENCY_BACKLOG.md#ux-11--typography--copy-normalization)
