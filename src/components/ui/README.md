# UI Components

Reusable, generic UI primitives used across dashboard features.

## Components

- `Card`: surface container with `default | bordered | elevated` variants.
- `SectionHeader`: section title with optional subtitle and right-side action.
- `Divider`: horizontal separator.
- `StatCard`: KPI value with optional change indicator.
- `InfoCard`: informational callout with semantic tone.
- `Banner`: full-width message strip with semantic tone.
- `KeyValue`: compact label-value row.
- `ListItem`: row/card item with title, subtitle, and trailing content.
- `FilterBar`: wrapper for grouped filters and controls.
- `Select`: controlled select input.
- `SearchInput`: controlled search input.
- `Badge`: generic pill label.
- `StatusBadge`: semantic badge built on top of `Badge`.
- `Button`: action button with `primary | secondary | ghost` variants.
- `Tabs`: controlled tab switcher.
- `EmptyState`: no-data placeholder with optional action.
- `LoadingState`: loading placeholder block.
- `ErrorState`: error display with optional action.

## Usage

```tsx
import { Button, Card, SectionHeader, StatCard } from '@/components/ui';

export const Example = () => {
  return (
    <Card variant="elevated">
      <SectionHeader title="Overview" action={<Button>Refresh</Button>} />
      <StatCard label="Completion Rate" value="68%" change={5} />
    </Card>
  );
};
```

## Preview

See `paths.uiPreview` route (`/ui-preview`) for a complete visual preview page that includes variants and edge cases.
