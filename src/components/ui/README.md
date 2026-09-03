# UI Components

Reusable, generic UI primitives used across dashboard features.

## Import

```tsx
import { Button, Card, SectionHeader, StatCard } from '@/components/ui';
```

## Component Reference

### `Card`

- **Props:** `children: ReactNode`, `variant?: 'default' | 'bordered' | 'elevated'`, `className?: string`
- **Variants:** `default` (flat white), `bordered` (bordered), `elevated` (ring + shadow)

### `SectionHeader`

- **Props:** `title: string`, `subtitle?: string`, `action?: ReactNode`
- **Variants:** none

### `Divider`

- **Props:** `className?: string`
- **Variants:** none

### `StatCard`

- **Props:** `label: string`, `value: string | number`, `change?: number`, `outOf?: string | number`, `tone?: StatCardTone`, `tooltip?: string`, `supportingText?: string`, …
- **Layout:** icon + label header → value bottom-right (`/outOf` when set)
- **Typography:** label 18px · value 38px · outOf 28px (`typographyClasses.kpiLabel` / `kpiValue` / `kpiOutOf`)

### `InfoCard`

- **Props:** `title: string`, `description: string`, `tone?: 'info' | 'success' | 'warning' | 'critical'`
- **Variants:** `tone` (`info`, `success`, `warning`, `critical`)

### `Banner`

- **Props:** `children: ReactNode`, `tone?: 'info' | 'success' | 'warning' | 'critical'`
- **Variants:** `tone` (`info`, `success`, `warning`, `critical`)

### `KeyValue`

- **Props:** `label: string`, `value: string | number | null | undefined`
- **Variants:** none

### `ListItem`

- **Props:** `title: string`, `subtitle?: string`, `rightContent?: ReactNode`, `className?: string`
- **Variants:** none

### `FilterBar`

- **Props:** `children: ReactNode`, `className?: string`
- **Variants:** none

### `Select`

- **Types:** `SelectOption = { label: string; value: string }`
- **Props:** `options: SelectOption[]`, `value: string`, `onChange: (value: string) => void`, plus native `<select>` props except `onChange` and `value`
- **Variants:** none

### `SearchInput`

- **Props:** `value: string`, `onChange: (value: string) => void`, plus native `<input>` props except `onChange` and `value`
- **Variants:** none

### `FormLabel`

- **Props:** `children`, `htmlFor?`, `required?`, `size?: 'default' | 'compact'`, `className?`
- **Default (`size="default"`):** `text-sm font-semibold text-spice-text-primary` (14px) — forms, modals, settings pages
- **Compact (`size="compact"`):** `text-xs font-semibold tracking-wide text-spice-text-medium` (12px) — filter drawers and dense grids
- Omit `htmlFor` to render a `<span>` inside an existing `<label>` wrapper

### `FormHelperText`

- **Props:** `children`, `className?`
- **Styles:** `text-xs text-spice-text-muted` — captions and hints under fields

### Typography (`PageSubtitle`, `ModalTitle`, `CardTitle`, `FieldGroupLabel`)

- **Import:** `from '@/components/ui'` (tokens: `typographyClasses`)
- **`PageSubtitle`:** secondary line under page titles (`text-sm` muted)
- **`ModalTitle`:** dialog headings (`text-lg` semibold); props: `as`, `id`, `className`
- **`CardTitle`:** in-card section headings (`text-sm` semibold); props: `as`, `className`
- **`FieldGroupLabel`:** uppercase micro-labels for field groups (`text-xs` tracking-wider); props: `as` (`div` | `h3` | `h4` | `p` | `span`), `className`
- **Page titles:** use `PageTitle` from `@/components/common/PageTitle` with optional `subtitle` prop
- **Full scale:** see [`docs/design-system-usage.md`](../../docs/design-system-usage.md#typography-scale)

### Table typography

- **Primary cell text:** inherited from `Table` (`text-sm text-spice-text-medium`) — do not wrap with `text-xs`.
- **Secondary line in same cell** (e.g. filename under title): `typographyClasses.tableCellSecondary`.
- **Headers:** `text-xs uppercase` via `Table` compact density.

### `Badge`

- **Props:** `children: ReactNode`, `variant?: 'default' | 'outline' | 'subtle'`, `size?: 'sm' | 'md'`, `className?: string`
- **Variants:** `default` (tint fill), `outline` (bordered), `subtle` (low emphasis)
- **Sizes:** `sm`, `md` (default)

### `StatusBadge`

- **Props:** `status: 'success' | 'warning' | 'critical' | 'info' | 'neutral'`, `label: string`
- **Variants:** `status` (`success`, `warning`, `critical`, `info`, `neutral`)

### `Button`

- **Props:** native `<button>` props plus `variant?: 'primary' | 'secondary' | 'ghost'`, `size?: 'sm' | 'md' | 'lg' | 'iconSm' | 'iconMd'`
- **Variants:** `primary`, `secondary`, `ghost`
- **Sizes:** `sm` (h-8), `md` (h-9, default), `lg` (h-10), `iconSm`, `iconMd`

### `Tabs`

- **Types:** `TabItem = { label: string; value: string }`
- **Props:** `items: TabItem[]`, `value: string`, `onChange: (value: string) => void`, `idBase?: string`, `className?: string`, `variant?: 'underline' | 'default' | 'moduleLibrary'`
- **Helpers:** `getTabsA11yIds(idBase, value)` returns `{ tabId, panelId }` so tab panels can be linked via `aria-labelledby` and `aria-controls`
- **Variants:** `underline` (default — Team View style), `default` and `moduleLibrary` deprecated

### `EmptyState`

- **Props:** `title: string`, `description?: string`, `action?: ReactNode`
- **Variants:** none

### `Loader`

- **Props:** `open?: boolean`, `label?: string`
- Full-screen grey overlay with circular spinner

### `ErrorState`

- **Props:** `title: string`, `description?: string`, `action?: ReactNode`
- **Variants:** none

## Accessibility Example (`Tabs` + `tabpanel`)

```tsx
import { Tabs, getTabsA11yIds, type TabItem } from '@/components/ui';
import { useState } from 'react';

const tabs: TabItem[] = [
  { label: 'Summary', value: 'summary' },
  { label: 'Details', value: 'details' },
];

export const Example = () => {
  const idBase = 'report-tabs';
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const activeIds = getTabsA11yIds(idBase, activeTab);

  return (
    <>
      <Tabs items={tabs} value={activeTab} onChange={setActiveTab} idBase={idBase} />
      <section
        role="tabpanel"
        id={activeIds.panelId}
        aria-labelledby={activeIds.tabId}
      >
        Panel content for {activeTab}
      </section>
    </>
  );
};
```

## Preview

Use Story-style pages and component tests in this folder to verify variants and edge cases locally.
