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

- **Props:** `label: string`, `value: string | number`, `change?: number`
- **Variants:** none (`change` value controls positive/negative/neutral tone)

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

### `Badge`

- **Props:** `children: ReactNode`, `className?: string`
- **Variants:** none

### `StatusBadge`

- **Props:** `status: 'success' | 'warning' | 'critical' | 'info' | 'neutral'`, `label: string`
- **Variants:** `status` (`success`, `warning`, `critical`, `info`, `neutral`)

### `Button`

- **Props:** native `<button>` props plus `variant?: 'primary' | 'secondary' | 'ghost'`
- **Variants:** `primary`, `secondary`, `ghost`

### `Tabs`

- **Types:** `TabItem = { label: string; value: string }`
- **Props:** `items: TabItem[]`, `value: string`, `onChange: (value: string) => void`, `idBase?: string`, `className?: string`
- **Helpers:** `getTabsA11yIds(idBase, value)` returns `{ tabId, panelId }` so tab panels can be linked via `aria-labelledby` and `aria-controls`
- **Variants:** none

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
